import { formatPrice } from "@/lib/store/money";

export interface WhatsAppOrderSummary {
  number: number;
  customerName: string;
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>;
  shippingLabel: string | null;
  shippingCents: number;
  totalCents: number;
  orderUrl: string;
  customerNote?: string | null;
}

const LABELS = {
  pt: { hello: "Olá! Quero fazer este pedido", order: "Pedido", shipping: "Entrega", total: "Total", note: "Observação", details: "Detalhes", name: "Nome" },
  en: { hello: "Hi! I'd like to place this order", order: "Order", shipping: "Delivery", total: "Total", note: "Note", details: "Details", name: "Name" },
  es: { hello: "¡Hola! Quiero hacer este pedido", order: "Pedido", shipping: "Entrega", total: "Total", note: "Observación", details: "Detalles", name: "Nombre" },
};

/** Ready-to-send order text for the seller's WhatsApp. */
export function buildWhatsAppOrderMessage(order: WhatsAppOrderSummary, locale = "pt"): string {
  const l = LABELS[locale === "en" || locale === "es" ? locale : "pt"];
  const lines = [
    `${l.hello} (${l.order} #${order.number}):`,
    "",
    ...order.items.map((item) => `• ${item.quantity}× ${item.name} — ${formatPrice(item.unitPriceCents * item.quantity, locale)}`),
    "",
  ];
  if (order.shippingLabel) {
    lines.push(`${l.shipping}: ${order.shippingLabel}${order.shippingCents ? ` — ${formatPrice(order.shippingCents, locale)}` : ""}`);
  }
  lines.push(`*${l.total}: ${formatPrice(order.totalCents, locale)}*`, "", `${l.name}: ${order.customerName}`);
  if (order.customerNote) lines.push(`${l.note}: ${order.customerNote}`);
  lines.push("", `${l.details}: ${order.orderUrl}`);
  return lines.join("\n");
}

export function whatsAppLink(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
