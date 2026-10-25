"use client";

import { useSyncExternalStore } from "react";

/**
 * Cart kept in the visitor's browser, one per profile handle. Prices here are
 * only for display: the server recalculates everything when the order is placed.
 */

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  type: "PHYSICAL" | "DIGITAL" | "SERVICE";
  quantity: number;
  /** Null when stock is unlimited. */
  maxQuantity: number | null;
}

const MAX_LINE_QUANTITY = 99;
const EMPTY: CartItem[] = [];
const memory = new Map<string, CartItem[]>();
const listeners = new Set<() => void>();
const snapshots = new Map<string, { raw: string | null; items: CartItem[] }>();

const storageKey = (handle: string) => `mp-cart:${handle.toLowerCase()}`;

function readRaw(handle: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(handle));
  } catch {
    return null;
  }
}

function read(handle: string): CartItem[] {
  const raw = readRaw(handle);
  if (raw === null) return memory.get(handle) ?? EMPTY;
  const cached = snapshots.get(handle);
  if (cached && cached.raw === raw) return cached.items;
  let items: CartItem[] = EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) items = parsed.filter((i) => i && typeof i.productId === "string");
  } catch {
    items = EMPTY;
  }
  snapshots.set(handle, { raw, items });
  return items;
}

function write(handle: string, items: CartItem[]) {
  memory.set(handle, items);
  try {
    window.localStorage.setItem(storageKey(handle), JSON.stringify(items));
  } catch {
    // Private mode or blocked storage: the in-memory copy keeps the cart for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("mp-cart:")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function clampQuantity(quantity: number, max: number | null) {
  return Math.max(1, Math.min(quantity, max ?? MAX_LINE_QUANTITY, MAX_LINE_QUANTITY));
}

export function addToCart(handle: string, item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = read(handle);
  const existing = items.find((i) => i.productId === item.productId);
  const next = existing
    ? items.map((i) =>
        i.productId === item.productId ? { ...item, quantity: clampQuantity(i.quantity + quantity, item.maxQuantity) } : i
      )
    : [...items, { ...item, quantity: clampQuantity(quantity, item.maxQuantity) }];
  write(handle, next);
}

export function setCartQuantity(handle: string, productId: string, quantity: number) {
  const items = read(handle);
  write(
    handle,
    quantity <= 0
      ? items.filter((i) => i.productId !== productId)
      : items.map((i) => (i.productId === productId ? { ...i, quantity: clampQuantity(quantity, i.maxQuantity) } : i))
  );
}

export function clearCart(handle: string) {
  write(handle, EMPTY);
}

export function useCart(handle: string): CartItem[] {
  return useSyncExternalStore(
    subscribe,
    () => read(handle),
    () => EMPTY
  );
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
