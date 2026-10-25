import { prisma } from "@/lib/db/client";
import { getBaseUrl } from "@/lib/env";
import { formatPrice } from "@/lib/store/money";

/**
 * Order emails through Resend. Best effort: without RESEND_API_KEY (local
 * dev) nothing is sent, and a failure never affects the order itself.
 */

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function send(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "MeuPerfil <login@meuperfil.me>", to: [to], subject, html }),
  });
  return response.ok;
}

const STATUS_TEXT = {
  pt: {
    PAID: "Pagamento confirmado",
    PREPARING: "Pedido em preparação",
    SHIPPED: "Pedido enviado",
    DELIVERED: "Pedido entregue",
    COMPLETED: "Pedido concluído",
    CANCELED: "Pedido cancelado",
    REFUNDED: "Pedido reembolsado",
    view: "Ver pedido",
    tracking: "Código de rastreio",
  },
  en: {
    PAID: "Payment confirmed",
    PREPARING: "Order being prepared",
    SHIPPED: "Order shipped",
    DELIVERED: "Order delivered",
    COMPLETED: "Order completed",
    CANCELED: "Order canceled",
    REFUNDED: "Order refunded",
    view: "View order",
    tracking: "Tracking code",
  },
  es: {
    PAID: "Pago confirmado",
    PREPARING: "Pedido en preparación",
    SHIPPED: "Pedido enviado",
    DELIVERED: "Pedido entregado",
    COMPLETED: "Pedido completado",
    CANCELED: "Pedido cancelado",
    REFUNDED: "Pedido reembolsado",
    view: "Ver pedido",
    tracking: "Código de seguimiento",
  },
} as const;

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      store: true,
      workspace: { select: { owner: { select: { email: true } } } },
    },
  });
}

async function orderUrl(order: { workspaceId: string; publicToken: string; locale: string }) {
  const profile = await prisma.profile.findFirst({
    where: { workspaceId: order.workspaceId, isPublished: true },
    orderBy: { createdAt: "asc" },
    select: { handle: true },
  });
  return profile ? `${getBaseUrl()}/${order.locale}/${profile.handle}/pedido/${order.publicToken}` : getBaseUrl();
}

export async function notifyNewOrder(orderId: string) {
  const order = await loadOrder(orderId);
  const ownerEmail = order?.workspace.owner.email;
  if (!order || !ownerEmail) return false;

  const lines = order.items
    .map((i) => `<li>${i.quantity}× ${escapeHtml(i.name)} — ${formatPrice(i.unitPriceCents * i.quantity)}</li>`)
    .join("");
  const channel = order.channel === "WHATSAPP" ? "WhatsApp" : order.channel === "PIX_DIRECT" ? "Pix direto" : "Plataforma";
  return send(
    ownerEmail,
    `Novo pedido #${order.number} — ${formatPrice(order.totalCents)}`,
    `
      <h2>Novo pedido #${order.number} na ${escapeHtml(order.store.name)}</h2>
      <p><strong>Cliente:</strong> ${escapeHtml(order.customerName)} · ${escapeHtml(order.customerPhone)}</p>
      <p><strong>Fechamento:</strong> ${channel}</p>
      <ul>${lines}</ul>
      ${order.shippingLabel ? `<p><strong>Entrega:</strong> ${escapeHtml(order.shippingLabel)} — ${formatPrice(order.shippingCents)}</p>` : ""}
      <p><strong>Total:</strong> ${formatPrice(order.totalCents)}</p>
      <p><a href="${getBaseUrl()}/pt/store/orders/${order.id}">Abrir no painel</a></p>
    `
  );
}

export async function notifyOrderStatus(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order?.customerEmail || order.status === "PENDING" || order.status === "AWAITING_PAYMENT") return false;

  const t = STATUS_TEXT[order.locale === "en" || order.locale === "es" ? order.locale : "pt"];
  const title = `${t[order.status]} — #${order.number}`;
  const url = await orderUrl(order);
  return send(
    order.customerEmail,
    `${title} · ${order.store.name}`,
    `
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(order.store.name)}</p>
      ${order.trackingCode ? `<p><strong>${t.tracking}:</strong> ${escapeHtml(order.trackingCode)}</p>` : ""}
      <p><a href="${url}">${t.view}</a></p>
    `
  );
}
