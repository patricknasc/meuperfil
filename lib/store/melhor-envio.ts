import { createHash, randomUUID } from "node:crypto";
import { getRedisConnection } from "@/lib/queue/client";
import type { CarrierQuote } from "@/lib/store/shipping";

/**
 * Carrier quotes through Melhor Envio (Correios, Jadlog, etc.) using the
 * platform token. Quotes are cached for 30 minutes under a random ref so an
 * order can only use a price the server actually returned.
 */

const QUOTE_TTL_SECONDS = 30 * 60;

export interface PackageItem {
  productId: string;
  quantity: number;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  unitPriceCents: number;
}

interface CachedQuote {
  storeId: string;
  zip: string;
  itemsKey: string;
  quotes: CarrierQuote[];
}

interface MelhorEnvioService {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: { name?: string };
}

export function isMelhorEnvioConfigured() {
  return Boolean(process.env.MELHOR_ENVIO_TOKEN);
}

function baseUrl() {
  return process.env.MELHOR_ENVIO_ENV === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";
}

/** Stable key for "these products in these quantities". */
export function packageKey(items: Array<{ productId: string; quantity: number }>) {
  const normalized = [...items]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((i) => `${i.productId}:${i.quantity}`)
    .join(",");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

export function toCarrierQuotes(services: MelhorEnvioService[]): CarrierQuote[] {
  return services
    .filter((s) => !s.error && (s.custom_price ?? s.price))
    .map((s) => ({
      serviceId: String(s.id),
      label: [s.company?.name, s.name].filter(Boolean).join(" "),
      priceCents: Math.round(Number(s.custom_price ?? s.price) * 100),
      days: s.custom_delivery_time ?? s.delivery_time ?? 0,
    }))
    .filter((q) => Number.isFinite(q.priceCents) && q.priceCents > 0)
    .sort((a, b) => a.priceCents - b.priceCents);
}

export async function fetchCarrierQuotes(fromZip: string, toZip: string, items: PackageItem[]): Promise<CarrierQuote[]> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return [];

  const response = await fetch(`${baseUrl()}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT || "MeuPerfil (contato@meuperfil.me)",
    },
    body: JSON.stringify({
      from: { postal_code: fromZip },
      to: { postal_code: toZip },
      products: items.map((item) => ({
        id: item.productId,
        width: item.widthCm,
        height: item.heightCm,
        length: item.lengthCm,
        weight: item.weightGrams / 1000,
        insurance_value: item.unitPriceCents / 100,
        quantity: item.quantity,
      })),
      options: { receipt: false, own_hand: false },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    console.error("Melhor Envio quote failed:", response.status, await response.text().catch(() => ""));
    throw new Error("Não foi possível calcular o frete agora. Tente novamente.");
  }
  return toCarrierQuotes((await response.json()) as MelhorEnvioService[]);
}

export async function saveQuote(entry: CachedQuote): Promise<string> {
  const ref = randomUUID();
  await getRedisConnection().set(`store:quote:${ref}`, JSON.stringify(entry), "EX", QUOTE_TTL_SECONDS);
  return ref;
}

export async function loadQuote(ref: string): Promise<CachedQuote | null> {
  if (!/^[0-9a-f-]{36}$/.test(ref)) return null;
  const raw = await getRedisConnection().get(`store:quote:${ref}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedQuote;
  } catch {
    return null;
  }
}
