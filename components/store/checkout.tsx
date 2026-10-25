"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeTranslator } from "@/lib/i18n/store";
import { formatPrice } from "@/lib/store/money";
import { clearCart, setCartQuantity, useCart } from "./cart-state";

interface CheckoutProps {
  lang: string;
  handle: string;
  classes: {
    card: string;
    cardHover: string;
    title: string;
    muted: string;
    radius: string;
  };
}

interface CartInfo {
  products: Array<{ productId: string; name: string; slug: string; priceCents: number; stock: number | null; available: boolean; type: string; imageUrl: string | null }>;
  channels: { WHATSAPP: boolean; PIX_DIRECT: boolean };
  quoteShipping: boolean;
}

interface ShippingOption {
  id: string;
  kind: "none" | "pickup" | "flat" | "quote";
  label: string;
  priceCents: number;
  days?: number;
}

type Channel = "WHATSAPP" | "PIX_DIRECT";

function itemsFromKey(key: string) {
  return key
    ? key.split(",").map((part) => {
        const [productId, quantity] = part.split(":");
        return { productId, quantity: Number(quantity) };
      })
    : [];
}

const field = "w-full rounded-xl border border-current/20 bg-transparent px-3 py-2.5 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-current/30";

export function Checkout({ lang, handle, classes }: CheckoutProps) {
  const t = storeTranslator(lang);
  const router = useRouter();
  const items = useCart(handle);
  const api = `/api/store/public/${encodeURIComponent(handle)}`;

  const [info, setInfo] = useState<CartInfo | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [quoteRef, setQuoteRef] = useState<string | null>(null);
  const [quotedZip, setQuotedZip] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
    zip: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    website: "",
  });
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const cartKey = items.map((i) => `${i.productId}:${i.quantity}`).join(",");
  const payloadItems = itemsFromKey(cartKey);

  // Refresh prices/stock and the rule-based delivery options whenever the cart changes.
  useEffect(() => {
    const payloadItems = itemsFromKey(cartKey);
    if (!payloadItems.length) return;
    let cancelled = false;
    Promise.all([
      fetch(`${api}/cart`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: payloadItems }) }).then((r) => r.json()),
      fetch(`${api}/shipping`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: payloadItems, locale: lang }) }).then((r) => r.json()),
    ])
      .then(([cartJson, shippingJson]) => {
        if (cancelled) return;
        if (cartJson.success) {
          setInfo(cartJson.data);
          setChannel((current) => current ?? (cartJson.data.channels.WHATSAPP ? "WHATSAPP" : cartJson.data.channels.PIX_DIRECT ? "PIX_DIRECT" : null));
        }
        if (shippingJson.success) {
          setOptions(shippingJson.data.options);
          setQuoteRef(null);
          setQuotedZip(null);
          setShippingId((current) => (shippingJson.data.options.some((o: ShippingOption) => o.id === current) ? current : shippingJson.data.options[0]?.id ?? ""));
        } else {
          setError(shippingJson.error);
        }
      })
      .catch(() => !cancelled && setError(t("Não foi possível carregar o carrinho.")));
    return () => {
      cancelled = true;
    };
  }, [api, cartKey, lang, t]);

  const productInfo = new Map(info?.products.map((p) => [p.productId, p]) ?? []);
  const lines = items.map((item) => {
    const current = productInfo.get(item.productId);
    return { ...item, priceCents: current?.priceCents ?? item.priceCents, available: current ? current.available : true, stock: current?.stock ?? item.maxQuantity };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
  const requiresShipping = lines.some((l) => l.type === "PHYSICAL");
  const selected = options.find((o) => o.id === shippingId);
  const needsAddress = requiresShipping && selected?.kind !== "pickup";
  const total = subtotal + (selected?.priceCents ?? 0);
  const unavailable = lines.filter((l) => !l.available);

  async function lookupZip(zip: string) {
    const digits = zip.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) return;
      setForm((f) => ({
        ...f,
        street: f.street || data.logradouro || "",
        district: f.district || data.bairro || "",
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch {
      // Address autofill is a convenience; the buyer can type it.
    }
  }

  async function quote() {
    const zip = form.zip.replace(/\D/g, "");
    if (zip.length !== 8) return setError(t("Informe um CEP com 8 dígitos."));
    setError(null);
    setQuoting(true);
    void lookupZip(zip);
    try {
      const res = await fetch(`${api}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems, zip, locale: lang }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setOptions(json.data.options);
      setQuoteRef(json.data.quoteRef);
      setQuotedZip(zip);
      const cheapestQuote = json.data.options.find((o: ShippingOption) => o.kind === "quote");
      setShippingId(cheapestQuote?.id ?? json.data.options[0]?.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível calcular o frete."));
    } finally {
      setQuoting(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!channel) return setError(t("Esta loja ainda não configurou como receber pedidos."));
    if (!selected) return setError(t("Escolha uma forma de entrega."));
    if (selected.kind === "quote" && quotedZip !== form.zip.replace(/\D/g, "")) {
      return setError(t("O CEP mudou. Calcule o frete novamente."));
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${api}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payloadItems,
          channel,
          locale: lang,
          website: form.website || undefined,
          customer: { name: form.name, phone: form.phone, email: form.email || null, note: form.note || null },
          shippingOptionId: selected.id,
          shippingQuoteRef: selected.kind === "quote" ? quoteRef : null,
          address: needsAddress
            ? {
                zip: form.zip,
                street: form.street,
                number: form.number,
                complement: form.complement || null,
                district: form.district,
                city: form.city,
                state: form.state,
              }
            : null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      clearCart(handle);
      router.push(`/${lang}/${handle}/pedido/${json.data.publicToken}?novo=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível registrar o pedido."));
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center">
        <p className={`text-lg font-semibold ${classes.title}`}>{t("Seu carrinho está vazio")}</p>
        <Link href={`/${lang}/${handle}/loja`} className={`mt-4 inline-block px-5 py-3 text-sm font-semibold ${classes.radius} ${classes.card} ${classes.cardHover}`}>
          {t("Ver loja")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className={`text-xl ${classes.title}`}>{t("Carrinho")}</h1>
          <ul className="space-y-2">
            {lines.map((line) => (
              <li key={line.productId} className={`flex items-center gap-3 p-3 ${classes.radius} ${classes.card}`}>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  {line.imageUrl && <Image unoptimized fill sizes="64px" src={line.imageUrl} alt="" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/${lang}/${handle}/loja/${line.slug}`} className="line-clamp-2 text-sm font-semibold hover:underline">
                    {line.name}
                  </Link>
                  <p className={`text-xs ${classes.muted}`}>{formatPrice(line.priceCents, lang)}</p>
                  {!line.available && <p className="text-xs font-semibold text-rose-500">{t("Indisponível — remova para continuar")}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCartQuantity(handle, line.productId, line.quantity - 1)}
                    aria-label={t("Diminuir quantidade")}
                    className="h-8 w-8 rounded-full border border-current/20 text-sm font-bold"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold" aria-label={t("Quantidade")}>
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCartQuantity(handle, line.productId, line.quantity + 1)}
                    disabled={line.stock !== null && line.quantity >= line.stock}
                    aria-label={t("Aumentar quantidade")}
                    className="h-8 w-8 rounded-full border border-current/20 text-sm font-bold disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {requiresShipping && (
          <section className="space-y-3">
            <h2 className={`text-base ${classes.title}`}>{t("Entrega")}</h2>
            {info?.quoteShipping && (
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder={t("CEP")}
                  aria-label={t("CEP")}
                  maxLength={9}
                  value={form.zip}
                  onChange={(e) => set("zip", e.target.value)}
                  className={field}
                />
                <button type="button" onClick={() => void quote()} disabled={quoting} className={`shrink-0 px-4 text-sm font-semibold ${classes.radius} ${classes.card}`}>
                  {quoting ? t("Calculando…") : t("Calcular frete")}
                </button>
              </div>
            )}
            {options.length === 0 ? (
              <p className={`text-sm ${classes.muted}`}>
                {info?.quoteShipping ? t("Informe o CEP para ver as opções de entrega.") : t("Esta loja ainda não configurou a entrega.")}
              </p>
            ) : (
              <div className="space-y-2" role="radiogroup" aria-label={t("Entrega")}>
                {options.map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-center gap-3 p-3 text-sm ${classes.radius} ${classes.card} ${shippingId === option.id ? "ring-2 ring-current/40" : ""}`}>
                    <input type="radio" name="shipping" value={option.id} checked={shippingId === option.id} onChange={() => setShippingId(option.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{option.label}</span>
                      {option.days ? <span className={`block text-xs ${classes.muted}`}>{t("até")} {option.days} {t("dias úteis")}</span> : null}
                    </span>
                    <span className="font-semibold">{option.priceCents ? formatPrice(option.priceCents, lang) : t("Grátis")}</span>
                  </label>
                ))}
              </div>
            )}

            {needsAddress && (
              <div className="grid grid-cols-6 gap-2">
                {!info?.quoteShipping && (
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder={t("CEP")}
                    aria-label={t("CEP")}
                    maxLength={9}
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                    onBlur={(e) => void lookupZip(e.target.value)}
                    className={`${field} col-span-6`}
                  />
                )}
                <input required autoComplete="address-line1" placeholder={t("Rua")} aria-label={t("Rua")} value={form.street} onChange={(e) => set("street", e.target.value)} className={`${field} col-span-4`} />
                <input required placeholder={t("Número")} aria-label={t("Número")} value={form.number} onChange={(e) => set("number", e.target.value)} className={`${field} col-span-2`} />
                <input autoComplete="address-line2" placeholder={t("Complemento")} aria-label={t("Complemento")} value={form.complement} onChange={(e) => set("complement", e.target.value)} className={`${field} col-span-3`} />
                <input required placeholder={t("Bairro")} aria-label={t("Bairro")} value={form.district} onChange={(e) => set("district", e.target.value)} className={`${field} col-span-3`} />
                <input required autoComplete="address-level2" placeholder={t("Cidade")} aria-label={t("Cidade")} value={form.city} onChange={(e) => set("city", e.target.value)} className={`${field} col-span-4`} />
                <input required autoComplete="address-level1" placeholder="UF" aria-label="UF" maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} className={`${field} col-span-2`} />
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <h2 className={`text-base ${classes.title}`}>{t("Seus dados")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input required autoComplete="name" placeholder={t("Nome completo")} aria-label={t("Nome completo")} value={form.name} onChange={(e) => set("name", e.target.value)} className={`${field} sm:col-span-2`} />
            <input required type="tel" autoComplete="tel" placeholder={t("WhatsApp com DDD")} aria-label={t("WhatsApp com DDD")} value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
            <input type="email" autoComplete="email" placeholder={t("E-mail (opcional)")} aria-label={t("E-mail (opcional)")} value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
            <textarea rows={2} maxLength={500} placeholder={t("Observação (opcional)")} aria-label={t("Observação (opcional)")} value={form.note} onChange={(e) => set("note", e.target.value)} className={`${field} sm:col-span-2`} />
            {/* Honeypot for bots; hidden from people and assistive tech. */}
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => set("website", e.target.value)} className="hidden" name="website" />
          </div>
        </section>
      </div>

      <aside className="space-y-4 md:sticky md:top-20 md:self-start">
        <section className={`space-y-3 p-4 ${classes.radius} ${classes.card}`}>
          <h2 className={`text-base ${classes.title}`}>{t("Como você quer finalizar?")}</h2>
          {info && !info.channels.WHATSAPP && !info.channels.PIX_DIRECT && (
            <p className="text-sm text-rose-500">{t("Esta loja ainda não configurou como receber pedidos.")}</p>
          )}
          {info?.channels.WHATSAPP && (
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="radio" name="channel" checked={channel === "WHATSAPP"} onChange={() => setChannel("WHATSAPP")} className="mt-1" />
              <span>
                <span className="block font-semibold">{t("Combinar pelo WhatsApp")}</span>
                <span className={`block text-xs ${classes.muted}`}>{t("Enviamos o pedido pronto para o vendedor e vocês combinam o pagamento.")}</span>
              </span>
            </label>
          )}
          {info?.channels.PIX_DIRECT && (
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="radio" name="channel" checked={channel === "PIX_DIRECT"} onChange={() => setChannel("PIX_DIRECT")} className="mt-1" />
              <span>
                <span className="block font-semibold">{t("Pagar com Pix")}</span>
                <span className={`block text-xs ${classes.muted}`}>{t("QR Code com o valor exato. O vendedor confirma o recebimento.")}</span>
              </span>
            </label>
          )}
        </section>

        <section className={`space-y-2 p-4 text-sm ${classes.radius} ${classes.card}`}>
          <div className="flex justify-between">
            <span className={classes.muted}>{t("Subtotal")}</span>
            <span>{formatPrice(subtotal, lang)}</span>
          </div>
          {requiresShipping && (
            <div className="flex justify-between">
              <span className={classes.muted}>{t("Entrega")}</span>
              <span>{selected ? (selected.priceCents ? formatPrice(selected.priceCents, lang) : t("Grátis")) : "—"}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-current/10 pt-2 text-base font-bold">
            <span>{t("Total")}</span>
            <span>{formatPrice(total, lang)}</span>
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !channel || !selected || unavailable.length > 0}
          className={`w-full px-5 py-4 text-sm font-bold disabled:opacity-50 ${classes.radius} ${classes.card} ${classes.cardHover}`}
        >
          {submitting ? t("Enviando pedido…") : channel === "PIX_DIRECT" ? t("Gerar Pix") : t("Enviar pedido")}
        </button>
      </aside>
    </form>
  );
}
