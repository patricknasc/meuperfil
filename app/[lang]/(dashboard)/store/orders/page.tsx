"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { storeTranslator } from "@/lib/i18n/store";
import { workspaceDateLocale } from "@/lib/i18n/workspace";
import { formatPrice } from "@/lib/store/money";
import StatCard from "@/components/stat-card";
import { IconActivity, IconOverview, IconStore } from "@/components/app-icons";
import { ORDER_CHANNEL_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/components/store/order-labels";

interface OrderRow {
  id: string;
  number: number;
  status: string;
  channel: string;
  customerName: string;
  totalCents: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

interface OrdersData {
  orders: OrderRow[];
  total: number;
  page: number;
  pageCount: number;
  summary: { pendingCount: number; paid30dCount: number; paid30dCents: number };
}

export default function StoreOrdersPage() {
  const { lang } = useParams<{ lang: string }>();
  const t = storeTranslator(lang);
  const [filters, setFilters] = useState({ status: "", channel: "", search: "", page: 1 });
  const [query, setQuery] = useState(filters);
  const [data, setData] = useState<OrdersData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value && !(key === "page" && value === 1)) qs.set(key, String(value));
    fetch(`/api/store/orders?${qs}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) throw new Error(json.error);
        setData(json.data);
        setError(null);
      })
      .catch(() => !cancelled && setError(t("Não foi possível carregar os pedidos.")));
    return () => {
      cancelled = true;
    };
  }, [query, t]);

  const dateLocale = workspaceDateLocale(lang);
  const apply = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next, page: next.page ?? 1 };
    setFilters(merged);
    setQuery(merged);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          icon={<IconActivity className="h-5 w-5" />}
          label={t("Aguardando ação")}
          value={data ? String(data.summary.pendingCount) : "—"}
        />
        <StatCard
          icon={<IconStore className="h-5 w-5" />}
          label={t("Pagos nos últimos 30 dias")}
          value={data ? String(data.summary.paid30dCount) : "—"}
        />
        <StatCard
          icon={<IconOverview className="h-5 w-5" />}
          label={t("Vendido nos últimos 30 dias")}
          value={data ? formatPrice(data.summary.paid30dCents, lang) : "—"}
        />
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({});
        }}
      >
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder={t("Buscar por nº, nome ou telefone")}
          aria-label={t("Buscar por nº, nome ou telefone")}
          className="min-w-48 flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm"
        />
        <select value={filters.status} onChange={(e) => apply({ status: e.target.value })} aria-label={t("Status")} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
          <option value="">{t("Todos os status")}</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
        <select value={filters.channel} onChange={(e) => apply({ channel: e.target.value })} aria-label={t("Canal")} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
          <option value="">{t("Todos os canais")}</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="PIX_DIRECT">{t("Pix direto")}</option>
        </select>
        <button type="submit" className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold">
          {t("Buscar")}
        </button>
      </form>

      {error && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {!data ? (
        <div className="glass h-48 animate-pulse rounded-2xl" />
      ) : data.orders.length === 0 ? (
        <div className="glass mx-auto max-w-xl rounded-2xl p-10 text-center">
          <h2 className="text-lg font-bold text-foreground">{t("Nenhum pedido ainda")}</h2>
          <p className="mt-2 text-sm text-muted">{t("Quando alguém comprar pela sua loja, o pedido aparece aqui.")}</p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <ul className="divide-y divide-border">
            {data.orders.map((order) => (
              <li key={order.id}>
                <Link href={`/${lang}/store/orders/${order.id}`} className="flex flex-col gap-1 px-4 py-3 transition hover:bg-surface-hover sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-foreground">#{order.number}</span>
                    <span className="truncate text-sm text-foreground">{order.customerName}</span>
                  </div>
                  <p className="truncate text-xs text-muted sm:w-56">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs text-muted">
                      {t(ORDER_CHANNEL_LABEL[order.channel])} · {new Date(order.createdAt).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ORDER_STATUS_TONE[order.status]}`}>{t(ORDER_STATUS_LABEL[order.status])}</span>
                    <span className="w-24 text-right text-sm font-bold text-foreground">{formatPrice(order.totalCents, lang)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {data.pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <button type="button" disabled={data.page <= 1} onClick={() => apply({ page: data.page - 1 })} className="text-accent disabled:opacity-30">
                {t("Anterior")}
              </button>
              <span className="text-xs text-muted">
                {t("Página")} {data.page} {t("de")} {data.pageCount}
              </span>
              <button type="button" disabled={data.page >= data.pageCount} onClick={() => apply({ page: data.page + 1 })} className="text-accent disabled:opacity-30">
                {t("Próxima")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
