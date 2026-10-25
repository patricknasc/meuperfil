import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { Prisma, type OrderStatus, type Store } from "@/app/generated/prisma/client";
import { captureLeadFromInteraction } from "@/lib/crm";
import { decryptToken } from "@/lib/meta/oauth";
import { buildPixPayload } from "@/lib/store/pix";
import { buildWhatsAppOrderMessage, whatsAppLink } from "@/lib/store/whatsapp";
import { canTransition, statusTimestampField, UNPAID_STATUSES, PAID_STATUSES } from "@/lib/store/order-status";
import {
  addressSchema,
  buildShippingOptions,
  formatAddress,
  type CarrierQuote,
  type ShippingAddress,
  type ShippingOption,
} from "@/lib/store/shipping";
import { fetchCarrierQuotes, loadQuote, packageKey, saveQuote, type PackageItem } from "@/lib/store/melhor-envio";
import { normalizeZip } from "@/lib/store/validation";
import { notifyNewOrder, notifyOrderStatus } from "@/lib/store/emails";

// ─── Input ──────────────────────────────────────────────────────────────────

export const cartItemsSchema = z
  .array(z.object({ productId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(99) }))
  .min(1, "O carrinho está vazio")
  .max(50, "Carrinho com itens demais");

export const placeOrderSchema = z.object({
  items: cartItemsSchema,
  channel: z.enum(["WHATSAPP", "PIX_DIRECT"]),
  customer: z.object({
    name: z.string().trim().min(2, "Informe seu nome").max(120),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length >= 10 && v.length <= 15, "Informe um telefone com DDD"),
    email: z.string().trim().toLowerCase().email("E-mail inválido").max(160).optional().nullable().or(z.literal("").transform(() => null)),
    note: z.string().trim().max(500).optional().nullable(),
  }),
  shippingOptionId: z.string().min(1).max(60),
  shippingQuoteRef: z.string().max(60).optional().nullable(),
  address: addressSchema.optional().nullable(),
  locale: z.enum(["pt", "en", "es"]).default("pt"),
  /** Honeypot: real visitors never see or fill it. */
  website: z.string().max(0, "Pedido inválido").optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export class StoreOrderError extends Error {}

// ─── Cart resolution ────────────────────────────────────────────────────────

/** Loads cart products from the database; prices and stock always come from here. */
async function resolveCart(storeId: string, items: z.infer<typeof cartItemsSchema>) {
  const merged = new Map<string, number>();
  for (const item of items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);

  const products = await prisma.product.findMany({
    where: { storeId, isActive: true, id: { in: [...merged.keys()] } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (products.length !== merged.size) {
    throw new StoreOrderError("Alguns itens do carrinho não estão mais disponíveis. Revise o carrinho.");
  }

  const lines = products.map((product) => {
    const quantity = Math.min(merged.get(product.id)!, 99);
    if (product.stock !== null && product.stock < quantity) {
      throw new StoreOrderError(
        product.stock === 0 ? `“${product.name}” esgotou.` : `Só restam ${product.stock} unidades de “${product.name}”.`
      );
    }
    return { product, quantity };
  });

  const subtotalCents = lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);
  const physical = lines.filter((l) => l.product.type === "PHYSICAL");
  const packageItems: PackageItem[] = physical.map((l) => ({
    productId: l.product.id,
    quantity: l.quantity,
    weightGrams: l.product.weightGrams ?? 300,
    heightCm: l.product.heightCm ?? 2,
    widthCm: l.product.widthCm ?? 11,
    lengthCm: l.product.lengthCm ?? 16,
    unitPriceCents: l.product.priceCents,
  }));
  return { lines, subtotalCents, requiresShipping: physical.length > 0, packageItems };
}

// ─── Shipping quotes ────────────────────────────────────────────────────────

export async function quoteShipping(store: Store, items: z.infer<typeof cartItemsSchema>, zipInput: string | null, locale: string) {
  const cart = await resolveCart(store.id, items);
  let quotes: CarrierQuote[] = [];
  let quoteRef: string | null = null;
  const zip = zipInput ? normalizeZip(zipInput) : null;

  if (cart.requiresShipping && store.quoteShipping && store.originZip && zip?.length === 8) {
    quotes = await fetchCarrierQuotes(store.originZip, zip, cart.packageItems);
    quoteRef = await saveQuote({ storeId: store.id, zip, itemsKey: packageKey(items), quotes });
  }

  const options = buildShippingOptions(store, cart.subtotalCents, cart.requiresShipping, quotes, locale);
  return { options, quoteRef, subtotalCents: cart.subtotalCents, requiresShipping: cart.requiresShipping };
}

async function chooseShipping(
  store: Store,
  input: PlaceOrderInput,
  cart: Awaited<ReturnType<typeof resolveCart>>
): Promise<ShippingOption> {
  let quotes: CarrierQuote[] = [];
  if (input.shippingOptionId.startsWith("quote:")) {
    const cached = input.shippingQuoteRef ? await loadQuote(input.shippingQuoteRef) : null;
    const zip = input.address?.zip;
    if (!cached || cached.storeId !== store.id || cached.zip !== zip || cached.itemsKey !== packageKey(input.items)) {
      throw new StoreOrderError("A cotação de frete expirou ou mudou. Calcule o frete novamente.");
    }
    quotes = cached.quotes;
  }
  const options = buildShippingOptions(store, cart.subtotalCents, cart.requiresShipping, quotes, input.locale);
  const chosen = options.find((o) => o.id === input.shippingOptionId);
  if (!chosen) throw new StoreOrderError("Escolha uma forma de entrega válida.");
  return chosen;
}

// ─── Placing orders ─────────────────────────────────────────────────────────

function newPublicToken() {
  return randomBytes(18).toString("base64url");
}

export function channelAvailable(store: Store, channel: PlaceOrderInput["channel"]) {
  if (channel === "WHATSAPP") return store.acceptWhatsapp && Boolean(store.whatsappPhone);
  return store.acceptPixDirect && Boolean(store.pixKey && store.pixKeyType && store.pixMerchantName && store.pixMerchantCity);
}

export async function placeOrder(store: Store, input: PlaceOrderInput, orderUrlFor: (token: string) => string) {
  if (!channelAvailable(store, input.channel)) {
    throw new StoreOrderError("Esta forma de pagamento não está disponível nesta loja.");
  }

  const cart = await resolveCart(store.id, input.items);
  const shipping = await chooseShipping(store, input, cart);
  let address: ShippingAddress | null = null;
  if (cart.requiresShipping && shipping.kind !== "pickup") {
    if (!input.address) throw new StoreOrderError("Informe o endereço de entrega.");
    address = input.address;
  }

  const totalCents = cart.subtotalCents + shipping.priceCents;
  const publicToken = newPublicToken();

  const order = await prisma.$transaction(async (tx) => {
    for (const { product, quantity } of cart.lines) {
      if (product.stock === null) continue;
      const reserved = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (reserved.count === 0) throw new StoreOrderError(`“${product.name}” esgotou enquanto você comprava.`);
    }

    const { nextOrderNumber } = await tx.store.update({
      where: { id: store.id },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true },
    });

    return tx.order.create({
      data: {
        storeId: store.id,
        workspaceId: store.workspaceId,
        number: nextOrderNumber - 1,
        publicToken,
        channel: input.channel,
        status: input.channel === "PIX_DIRECT" ? "AWAITING_PAYMENT" : "PENDING",
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        customerEmail: input.customer.email ?? null,
        customerNote: input.customer.note || null,
        locale: input.locale,
        shippingAddress: address ?? Prisma.DbNull,
        shippingMethod: shipping.id,
        shippingLabel: shipping.kind === "none" ? null : shipping.label,
        shippingCents: shipping.priceCents,
        shippingQuoteRef: shipping.kind === "quote" ? input.shippingQuoteRef ?? null : null,
        subtotalCents: cart.subtotalCents,
        totalCents,
        expiresAt: new Date(Date.now() + store.orderExpiryHours * 3600_000),
        items: {
          create: cart.lines.map(({ product, quantity }) => ({
            productId: product.id,
            name: product.name,
            type: product.type,
            unitPriceCents: product.priceCents,
            quantity,
            imageUrl: product.images[0]?.url ?? null,
          })),
        },
      },
      include: { items: true },
    });
  });

  // Side effects never undo a placed order.
  try {
    const lead = await captureLeadFromInteraction({
      workspaceId: store.workspaceId,
      source: "STORE",
      sourceId: order.id,
      interactionKey: order.id,
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail ?? undefined,
      tags: ["cliente-loja"],
    });
    await prisma.order.update({ where: { id: order.id }, data: { contactId: lead.contactId } });
  } catch (error) {
    console.error("Store order lead capture failed:", error);
  }
  void notifyNewOrder(order.id).catch((error) => console.error("Store order email failed:", error));

  const orderUrl = orderUrlFor(publicToken);
  const whatsappUrl =
    input.channel === "WHATSAPP" && store.whatsappPhone
      ? whatsAppLink(
          store.whatsappPhone,
          buildWhatsAppOrderMessage(
            {
              number: order.number,
              customerName: order.customerName,
              items: order.items,
              shippingLabel: order.shippingLabel,
              shippingCents: order.shippingCents,
              totalCents: order.totalCents,
              orderUrl,
              customerNote: order.customerNote,
            },
            input.locale
          )
        )
      : null;

  return { publicToken, number: order.number, orderUrl, whatsappUrl };
}

// ─── Buyer view ─────────────────────────────────────────────────────────────

export async function getOrderForBuyer(token: string) {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      items: { include: { product: { select: { slug: true, digitalDeliveryUrlEnc: true } } } },
      store: true,
    },
  });
  if (!order) return null;

  const paid = PAID_STATUSES.includes(order.status);
  const pixPayload =
    order.channel === "PIX_DIRECT" && UNPAID_STATUSES.includes(order.status) && order.store.pixKey && order.store.pixKeyType
      ? buildPixPayload({
          key: order.store.pixKey,
          keyType: order.store.pixKeyType,
          merchantName: order.store.pixMerchantName ?? order.store.name,
          merchantCity: order.store.pixMerchantCity ?? "Brasil",
          amountCents: order.totalCents,
          txid: `PED${order.number}`,
        })
      : null;

  const items = order.items.map(({ product, ...item }) => {
    let deliveryUrl: string | null = null;
    if (paid && item.type === "DIGITAL" && product?.digitalDeliveryUrlEnc) {
      try {
        deliveryUrl = decryptToken(product.digitalDeliveryUrlEnc);
      } catch {
        deliveryUrl = null;
      }
    }
    return { ...item, slug: product?.slug ?? null, deliveryUrl };
  });

  const { store, ...rest } = order;
  return {
    order: { ...rest, items },
    store: { name: store.name, whatsappPhone: store.whatsappPhone, workspaceId: store.workspaceId, returnPolicy: store.returnPolicy },
    pixPayload,
    address: order.shippingAddress ? formatAddress(order.shippingAddress as ShippingAddress) : null,
  };
}

// ─── Owner management ───────────────────────────────────────────────────────

export const orderFiltersSchema = z.object({
  status: z
    .enum(["PENDING", "AWAITING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED", "REFUNDED"])
    .optional()
    .catch(undefined),
  channel: z.enum(["WHATSAPP", "PIX_DIRECT", "PLATFORM"]).optional().catch(undefined),
  search: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

export async function listOrders(workspaceId: string, filters: z.infer<typeof orderFiltersSchema>) {
  const search = filters.search;
  const digits = search?.replace(/\D/g, "") ?? "";
  // "#12" or "12" is an order number; phone matching needs enough digits to mean something.
  const searchWhere: Prisma.OrderWhereInput | null = !search
    ? null
    : /^#?\d{1,6}$/.test(search)
      ? { number: Number(digits) }
      : {
          OR: [
            { customerName: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
            ...(digits.length >= 4 ? [{ customerPhone: { contains: digits } }] : []),
          ],
        };
  const where: Prisma.OrderWhereInput = {
    workspaceId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...searchWhere,
  };
  const page = filters.page ?? 1;
  const [orders, total, pendingCount, paidAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
      skip: (page - 1) * 30,
      include: { items: { select: { name: true, quantity: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.count({ where: { workspaceId, status: { in: UNPAID_STATUSES } } }),
    prisma.order.aggregate({
      where: { workspaceId, status: { in: PAID_STATUSES }, createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
      _sum: { totalCents: true },
      _count: true,
    }),
  ]);
  return {
    orders,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / 30)),
    summary: { pendingCount, paid30dCount: paidAgg._count, paid30dCents: paidAgg._sum.totalCents ?? 0 },
  };
}

export async function getOrderForOwner(workspaceId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, workspaceId },
    include: { items: true },
  });
  if (!order) return null;
  return {
    ...order,
    address: order.shippingAddress ? formatAddress(order.shippingAddress as ShippingAddress) : null,
  };
}

export const updateOrderSchema = z.object({
  status: z.enum(["AWAITING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED", "REFUNDED"]),
  trackingCode: z.string().trim().max(60).optional().nullable(),
});

async function restoreStock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId, productId: { not: null } } });
  for (const item of items) {
    // Products without stock control stay null; increment on null is a no-op in SQL.
    await tx.product.updateMany({
      where: { id: item.productId!, stock: { not: null } },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/** Moves an order to a new status; canceling an unpaid order returns its stock. */
export async function transitionOrder(
  where: { id: string; workspaceId?: string },
  to: OrderStatus,
  extra: { trackingCode?: string | null } = {}
) {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where });
    if (!order) throw new StoreOrderError("Pedido não encontrado");
    if (!canTransition(order.status, to)) {
      throw new StoreOrderError("Essa mudança de status não é permitida para este pedido.");
    }
    // Guard against two concurrent transitions of the same order.
    const field = statusTimestampField(to);
    const result = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: to,
        ...(field ? { [field]: new Date() } : {}),
        ...(extra.trackingCode !== undefined ? { trackingCode: extra.trackingCode || null } : {}),
        ...(to === "PAID" || to === "CANCELED" ? { expiresAt: null } : {}),
      },
    });
    if (result.count === 0) throw new StoreOrderError("O pedido mudou enquanto você editava. Atualize a página.");
    if (to === "CANCELED") await restoreStock(tx, order.id);
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
  });

  void notifyOrderStatus(updated.id).catch((error) => console.error("Store status email failed:", error));
  return updated;
}

export async function updateOrderForOwner(workspaceId: string, orderId: string, input: z.infer<typeof updateOrderSchema>) {
  return transitionOrder({ id: orderId, workspaceId }, input.status, { trackingCode: input.trackingCode });
}

/** Cancels unpaid orders past their deadline and returns the reserved stock. */
export async function expireStaleOrders(now = new Date()): Promise<number> {
  const stale = await prisma.order.findMany({
    where: { status: { in: UNPAID_STATUSES }, expiresAt: { lt: now } },
    select: { id: true },
    take: 200,
  });
  let expired = 0;
  for (const { id } of stale) {
    try {
      await transitionOrder({ id }, "CANCELED");
      expired++;
    } catch (error) {
      if (!(error instanceof StoreOrderError)) console.error("Store order expiry failed:", error);
    }
  }
  return expired;
}
