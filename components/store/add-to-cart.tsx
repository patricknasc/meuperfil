"use client";

import { useState } from "react";
import { addToCart, type CartItem } from "./cart-state";

interface AddToCartProps {
  handle: string;
  item: Omit<CartItem, "quantity">;
  labels: { add: string; added: string; soldOut: string; quantity: string };
  buttonClassName: string;
  inputClassName: string;
}

export function AddToCart({ handle, item, labels, buttonClassName, inputClassName }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = item.maxQuantity === 0;
  const max = item.maxQuantity ?? 99;

  if (soldOut) {
    return (
      <button type="button" disabled className={`w-full cursor-not-allowed px-5 py-3.5 text-sm font-semibold opacity-60 ${buttonClassName}`}>
        {labels.soldOut}
      </button>
    );
  }

  return (
    <div className="flex items-stretch gap-2">
      <label className="sr-only" htmlFor="quantity">
        {labels.quantity}
      </label>
      <input
        id="quantity"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
        className={`w-20 rounded-xl px-3 text-center text-sm ${inputClassName}`}
      />
      <button
        type="button"
        onClick={() => {
          addToCart(handle, item, quantity);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1800);
        }}
        className={`flex-1 px-5 py-3.5 text-sm font-semibold ${buttonClassName}`}
      >
        <span aria-live="polite">{added ? labels.added : labels.add}</span>
      </button>
    </div>
  );
}
