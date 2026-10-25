import { z } from "zod";
import { normalizeZip } from "@/lib/store/validation";

/**
 * Delivery options offered at checkout, built from the store rules
 * (pickup, flat rate, free shipping threshold) plus carrier quotes by
 * postcode. The server always rebuilds this list when an order is placed.
 */

export type ShippingKind = "none" | "pickup" | "flat" | "quote";

export interface ShippingOption {
  id: string;
  kind: ShippingKind;
  label: string;
  priceCents: number;
  /** Business days, for carrier quotes. */
  days?: number;
}

export interface CarrierQuote {
  serviceId: string;
  label: string;
  priceCents: number;
  days: number;
}

export interface ShippingRules {
  pickupEnabled: boolean;
  pickupAddress: string | null;
  flatShippingCents: number | null;
  freeShippingOverCents: number | null;
  quoteShipping: boolean;
}

const LABELS = {
  pt: { none: "Sem entrega (digital ou serviço)", pickup: "Retirar no local", flat: "Entrega", free: "grátis" },
  en: { none: "No delivery (digital or service)", pickup: "Local pickup", flat: "Delivery", free: "free" },
  es: { none: "Sin entrega (digital o servicio)", pickup: "Retiro en el local", flat: "Entrega", free: "gratis" },
};

export function shippingLabels(locale: string) {
  return LABELS[locale === "en" || locale === "es" ? locale : "pt"];
}

export function buildShippingOptions(
  rules: ShippingRules,
  subtotalCents: number,
  requiresShipping: boolean,
  quotes: CarrierQuote[],
  locale = "pt"
): ShippingOption[] {
  const l = shippingLabels(locale);
  if (!requiresShipping) return [{ id: "none", kind: "none", label: l.none, priceCents: 0 }];

  const free = rules.freeShippingOverCents != null && subtotalCents >= rules.freeShippingOverCents;
  const options: ShippingOption[] = [];

  if (rules.pickupEnabled) {
    options.push({
      id: "pickup",
      kind: "pickup",
      label: rules.pickupAddress ? `${l.pickup}: ${rules.pickupAddress}` : l.pickup,
      priceCents: 0,
    });
  }
  if (rules.flatShippingCents != null) {
    options.push({
      id: "flat",
      kind: "flat",
      label: free ? `${l.flat} (${l.free})` : l.flat,
      priceCents: free ? 0 : rules.flatShippingCents,
    });
  }
  for (const quote of quotes) {
    options.push({
      id: `quote:${quote.serviceId}`,
      kind: "quote",
      label: free ? `${quote.label} (${l.free})` : quote.label,
      priceCents: free ? 0 : quote.priceCents,
      days: quote.days,
    });
  }
  return options;
}

export const addressSchema = z.object({
  zip: z
    .string()
    .transform(normalizeZip)
    .refine((v) => v.length === 8, "CEP inválido"),
  street: z.string().trim().min(2, "Informe a rua").max(120),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(60).optional().nullable(),
  district: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Informe a UF com 2 letras"),
});

export type ShippingAddress = z.infer<typeof addressSchema>;

export function formatAddress(address: ShippingAddress): string {
  const zip = `${address.zip.slice(0, 5)}-${address.zip.slice(5)}`;
  return `${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ""}, ${address.district}, ${address.city}/${address.state}, CEP ${zip}`;
}
