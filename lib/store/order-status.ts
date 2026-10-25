import type { OrderStatus } from "@/app/generated/prisma/client";

/**
 * Order lifecycle. Unpaid orders can be paid or canceled (stock returns);
 * paid orders move forward through fulfilment or end refunded.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["AWAITING_PAYMENT", "PAID", "CANCELED"],
  AWAITING_PAYMENT: ["PAID", "CANCELED"],
  PAID: ["PREPARING", "SHIPPED", "COMPLETED", "REFUNDED"],
  PREPARING: ["SHIPPED", "COMPLETED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "COMPLETED", "REFUNDED"],
  DELIVERED: ["COMPLETED", "REFUNDED"],
  COMPLETED: ["REFUNDED"],
  CANCELED: [],
  REFUNDED: [],
};

export const UNPAID_STATUSES: OrderStatus[] = ["PENDING", "AWAITING_PAYMENT"];
export const PAID_STATUSES: OrderStatus[] = ["PAID", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED"];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from];
}

/** Timestamp column set when an order enters a status. */
export function statusTimestampField(status: OrderStatus): "paidAt" | "shippedAt" | "deliveredAt" | "canceledAt" | null {
  switch (status) {
    case "PAID":
      return "paidAt";
    case "SHIPPED":
      return "shippedAt";
    case "DELIVERED":
      return "deliveredAt";
    case "CANCELED":
      return "canceledAt";
    default:
      return null;
  }
}
