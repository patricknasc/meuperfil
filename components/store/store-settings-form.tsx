"use client";

import { useState } from "react";
import { storeTranslator } from "@/lib/i18n/store";
import { parsePriceInput } from "@/lib/store/money";
import type { AdminStore } from "./admin-types";

const input = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";
const labelText = "font-medium text-foreground";
const hint = "text-xs text-muted";

function centsToInput(cents: number | null) {
  return cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

function Toggle({ checked, onChange, title, description }: { checked: boolean; onChange: (v: boolean) => void; title: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className={`block text-sm ${labelText}`}>{title}</span>
        {description && <span className={`mt-0.5 block ${hint}`}>{description}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-accent" />
    </label>
  );
}

export function StoreSettingsForm({ lang, store }: { lang: string; store: AdminStore }) {
  const t = storeTranslator(lang);
  const [form, setForm] = useState({
    name: store.name,
    description: store.description ?? "",
    acceptWhatsapp: store.acceptWhatsapp,
    whatsappPhone: store.whatsappPhone ?? "",
    acceptPixDirect: store.acceptPixDirect,
    pixKeyType: store.pixKeyType ?? "",
    pixKey: store.pixKey ?? "",
    pixMerchantName: store.pixMerchantName ?? "",
    pixMerchantCity: store.pixMerchantCity ?? "",
    quoteShipping: store.quoteShipping,
    originZip: store.originZip ?? "",
    flatShipping: centsToInput(store.flatShippingCents),
    freeShippingOver: centsToInput(store.freeShippingOverCents),
    pickupEnabled: store.pickupEnabled,
    pickupAddress: store.pickupAddress ?? "",
    returnPolicy: store.returnPolicy ?? "",
    orderExpiryHours: String(store.orderExpiryHours),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          acceptWhatsapp: form.acceptWhatsapp,
          whatsappPhone: form.whatsappPhone || null,
          acceptPixDirect: form.acceptPixDirect,
          pixKeyType: form.pixKeyType || null,
          pixKey: form.pixKey || null,
          pixMerchantName: form.pixMerchantName || null,
          pixMerchantCity: form.pixMerchantCity || null,
          quoteShipping: form.quoteShipping,
          originZip: form.originZip || null,
          flatShippingCents: form.flatShipping ? parsePriceInput(form.flatShipping) : null,
          freeShippingOverCents: form.freeShippingOver ? parsePriceInput(form.freeShippingOver) : null,
          pickupEnabled: form.pickupEnabled,
          pickupAddress: form.pickupAddress || null,
          returnPolicy: form.returnPolicy || null,
          orderExpiryHours: Number(form.orderExpiryHours) || 48,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setMessage({ kind: "ok", text: t("Configurações salvas.") });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : t("Não foi possível salvar.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("Loja")}</h2>
        <label className="block space-y-1 text-sm">
          <span className={labelText}>{t("Nome da loja")}</span>
          <input required maxLength={80} value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className={labelText}>{t("Descrição curta")}</span>
          <textarea rows={2} maxLength={500} value={form.description} onChange={(e) => set("description", e.target.value)} className={input} />
        </label>
      </section>

      <section className="glass space-y-5 rounded-2xl p-4 sm:p-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("Como o cliente fecha a compra")}</h2>
          <p className={hint}>{t("O pagamento pela plataforma, com cartão e Pix intermediados, chega em breve.")}</p>
        </div>

        <Toggle
          checked={form.acceptWhatsapp}
          onChange={(v) => set("acceptWhatsapp", v)}
          title={t("Pedido pelo WhatsApp")}
          description={t("O cliente monta o carrinho e envia o pedido pronto para o seu WhatsApp.")}
        />
        {form.acceptWhatsapp && (
          <label className="block space-y-1 text-sm">
            <span className={labelText}>{t("WhatsApp da loja")}</span>
            <input inputMode="tel" placeholder="11 99999-8888" value={form.whatsappPhone} onChange={(e) => set("whatsappPhone", e.target.value)} className={input} />
          </label>
        )}

        <Toggle
          checked={form.acceptPixDirect}
          onChange={(v) => set("acceptPixDirect", v)}
          title={t("Pix direto na sua chave")}
          description={t("Geramos o QR Code com o valor do pedido. Você confere o recebimento no banco e marca o pedido como pago.")}
        />
        {form.acceptPixDirect && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className={labelText}>{t("Tipo de chave")}</span>
              <select value={form.pixKeyType} onChange={(e) => set("pixKeyType", e.target.value)} className={input}>
                <option value="">{t("Selecione")}</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">E-mail</option>
                <option value="PHONE">{t("Celular")}</option>
                <option value="RANDOM">{t("Chave aleatória")}</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className={labelText}>{t("Chave Pix")}</span>
              <input maxLength={140} value={form.pixKey} onChange={(e) => set("pixKey", e.target.value)} className={input} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className={labelText}>{t("Nome do recebedor")}</span>
              <input maxLength={25} value={form.pixMerchantName} onChange={(e) => set("pixMerchantName", e.target.value)} className={input} />
              <span className={hint}>{t("Como aparece no app do banco (até 25 letras).")}</span>
            </label>
            <label className="block space-y-1 text-sm">
              <span className={labelText}>{t("Cidade do recebedor")}</span>
              <input maxLength={15} value={form.pixMerchantCity} onChange={(e) => set("pixMerchantCity", e.target.value)} className={input} />
            </label>
          </div>
        )}
      </section>

      <section className="glass space-y-5 rounded-2xl p-4 sm:p-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("Entrega de produtos físicos")}</h2>
          <p className={hint}>{t("Itens digitais e serviços não pedem endereço nem frete.")}</p>
        </div>

        <Toggle
          checked={form.quoteShipping}
          onChange={(v) => set("quoteShipping", v)}
          title={t("Calcular frete pelo CEP")}
          description={t("Correios e transportadoras, com preço e prazo, a partir do seu CEP.")}
        />
        <label className="block space-y-1 text-sm">
          <span className={labelText}>{t("CEP de origem")}</span>
          <input inputMode="numeric" placeholder="01310-100" maxLength={9} value={form.originZip} onChange={(e) => set("originZip", e.target.value)} className={input} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className={labelText}>{t("Frete fixo (opcional)")}</span>
            <input inputMode="decimal" placeholder="15,00" value={form.flatShipping} onChange={(e) => set("flatShipping", e.target.value)} className={input} />
            <span className={hint}>{t("Valor único por pedido, além ou no lugar do cálculo por CEP.")}</span>
          </label>
          <label className="block space-y-1 text-sm">
            <span className={labelText}>{t("Frete grátis acima de (opcional)")}</span>
            <input inputMode="decimal" placeholder="199,00" value={form.freeShippingOver} onChange={(e) => set("freeShippingOver", e.target.value)} className={input} />
          </label>
        </div>

        <Toggle checked={form.pickupEnabled} onChange={(v) => set("pickupEnabled", v)} title={t("Retirada no local")} />
        {form.pickupEnabled && (
          <label className="block space-y-1 text-sm">
            <span className={labelText}>{t("Endereço e horário de retirada")}</span>
            <textarea rows={2} maxLength={300} value={form.pickupAddress} onChange={(e) => set("pickupAddress", e.target.value)} className={input} />
          </label>
        )}
      </section>

      <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("Pedidos e políticas")}</h2>
        <label className="block space-y-1 text-sm">
          <span className={labelText}>{t("Cancelar pedidos não pagos após (horas)")}</span>
          <input type="number" min={1} max={720} value={form.orderExpiryHours} onChange={(e) => set("orderExpiryHours", e.target.value)} className={`${input} max-w-32`} />
          <span className={hint}>{t("O estoque reservado volta para a loja.")}</span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className={labelText}>{t("Trocas e devoluções")}</span>
          <textarea
            rows={4}
            maxLength={2000}
            placeholder={t("Ex.: Trocas em até 7 dias após o recebimento, com o produto sem uso e na embalagem original.")}
            value={form.returnPolicy}
            onChange={(e) => set("returnPolicy", e.target.value)}
            className={input}
          />
        </label>
      </section>

      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-xl border p-3 text-sm ${message.kind === "error" ? "border-error/30 bg-error/5 text-error" : "border-success/30 bg-success/5 text-success"}`}
        >
          {message.text}
        </div>
      )}

      <button type="submit" disabled={saving} className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-60">
        {saving ? t("Salvando…") : t("Salvar configurações")}
      </button>
    </form>
  );
}
