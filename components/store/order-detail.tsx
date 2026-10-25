"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { storeTranslator } from "@/lib/i18n/store";
import { workspaceDateLocale } from "@/lib/i18n/workspace";
import { formatPrice } from "@/lib/store/money";
import { nextStatuses } from "@/lib/store/order-status";
import type { OrderStatus } from "@/app/generated/prisma/browser";
import { ORDER_ACTION_LABEL, ORDER_CHANNEL_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "./order-labels";

export interface OwnerOrder {
  id: string;
  number: number;
  status: OrderStatus;
  channel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNote: string | null;
  shippingLabel: string | null;
  shippingCents: number;
  subtotalCents: number;
  totalCents: number;
  trackingCode: string | null;
  address: string | null;
  createdAt: string | Date;
  paidAt: string | Date | null;
  shippedAt: string | Date | null;
  expiresAt: string | Date | null;
  items: Array<{ id: string; name: string; quantity: number; unitPriceCents: number; imageUrl: string | null; type: string }>;
}

export function OrderDetail({ lang, initialOrder }: { lang: string; initialOrder: OwnerOrder }) {
  const t = storeTranslator(lang);
  const [order, setOrder] = useState(initialOrder);
  const [tracking, setTracking] = useState(initialOrder.trackingCode ?? "");
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dateLocale = workspaceDateLocale(lang);
  const fmt = (value: string | Date | null) =>
    value ? new Date(value).toLocaleString(dateLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  async function move(status: OrderStatus) {
    if ((status === "CANCELED" || status === "REFUNDED") && !window.confirm(t("Confirmar esta mudança? Ela não pode ser desfeita."))) return;
    setBusy(status);
    setError(null);
    try {
      const res = await fetch(`/api/store/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingCode: status === "SHIPPED" ? tracking || null : undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setOrder((current) => ({ ...current, ...json.data, address: current.address }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível atualizar o pedido."));
    } finally {
      setBusy(null);
    }
  }

  const actions = nextStatuses(order.status);
  const phone = order.customerPhone.replace(/\D/g, "");
  const hasPhysical = order.items.some((i) => i.type === "PHYSICAL");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${lang}/store/orders`} className="text-sm text-muted hover:text-foreground">
            ← {t("Pedidos")}
          </Link>
          <h2 className="text-xl font-semibold text-foreground">
            {t("Pedido")} #{order.number}
          </h2>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_TONE[order.status]}`}>{t(ORDER_STATUS_LABEL[order.status])}</span>
          <span className="text-xs text-muted">{t(ORDER_CHANNEL_LABEL[order.channel])}</span>
        </div>

        <section className="glass rounded-2xl p-4 sm:p-6">
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-hover">
                  {item.imageUrl && <Image unoptimized fill sizes="48px" src={item.imageUrl} alt="" className="object-cover" />}
                </div>
                <span className="min-w-0 flex-1 text-foreground">
                  {item.quantity}× {item.name}
                </span>
                <span className="font-semibold text-foreground">{formatPrice(item.unitPriceCents * item.quantity, lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t("Subtotal")}</dt>
              <dd>{formatPrice(order.subtotalCents, lang)}</dd>
            </div>
            {order.shippingLabel && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{order.shippingLabel}</dt>
                <dd>{formatPrice(order.shippingCents, lang)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-foreground">
              <dt>{t("Total")}</dt>
              <dd>{formatPrice(order.totalCents, lang)}</dd>
            </div>
          </dl>
        </section>

        <section className="glass space-y-2 rounded-2xl p-4 text-sm sm:p-6">
          <h3 className="font-semibold text-foreground">{t("Cliente")}</h3>
          <p className="text-foreground">{order.customerName}</p>
          <p>
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="text-accent underline">
              {order.customerPhone}
            </a>
            {order.customerEmail && (
              <>
                {" · "}
                <a href={`mailto:${order.customerEmail}`} className="text-accent underline">
                  {order.customerEmail}
                </a>
              </>
            )}
          </p>
          {order.address && <p className="text-muted">{order.address}</p>}
          {order.customerNote && <p className="rounded-xl bg-surface-hover p-3 text-foreground">“{order.customerNote}”</p>}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="glass space-y-3 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground">{t("Ações")}</h3>
          {actions.includes("SHIPPED") && hasPhysical && (
            <label className="block space-y-1 text-sm">
              <span className="text-muted">{t("Código de rastreio (opcional)")}</span>
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={60} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
            </label>
          )}
          {actions.length === 0 && <p className="text-sm text-muted">{t("Este pedido está encerrado.")}</p>}
          <div className="flex flex-col gap-2">
            {actions
              .filter((status) => status !== "SHIPPED" || hasPhysical)
              .map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void move(status)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                    status === "CANCELED" || status === "REFUNDED"
                      ? "border border-error/30 text-error hover:bg-error/5"
                      : status === actions[0] || status === "PAID"
                        ? "bg-accent text-white hover:bg-accent-hover"
                        : "border border-border bg-surface text-foreground hover:border-border-hover"
                  }`}
                >
                  {busy === status ? t("Salvando…") : t(ORDER_ACTION_LABEL[status])}
                </button>
              ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
        </section>

        <section className="glass space-y-1 rounded-2xl p-4 text-xs text-muted">
          <p>
            {t("Criado")}: {fmt(order.createdAt)}
          </p>
          {order.paidAt && (
            <p>
              {t("Pago")}: {fmt(order.paidAt)}
            </p>
          )}
          {order.shippedAt && (
            <p>
              {t("Enviado")}: {fmt(order.shippedAt)}
            </p>
          )}
          {order.expiresAt && (
            <p>
              {t("Cancela automaticamente se não for pago até")}: {fmt(order.expiresAt)}
            </p>
          )}
          {order.trackingCode && (
            <p>
              {t("Código de rastreio")}: <span className="font-mono text-foreground">{order.trackingCode}</span>
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
