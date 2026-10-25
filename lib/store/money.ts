/** Prices are stored in cents and always charged in BRL. */
export function formatPrice(cents: number, locale = "pt"): string {
  const tag = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR";
  return new Intl.NumberFormat(tag, { style: "currency", currency: "BRL" }).format(cents / 100);
}

/** "49,90" / "49.90" / "1.249,90" → 4990; returns null when it is not a price. */
export function parsePriceInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const lastSep = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
  const hasDecimals = lastSep >= 0 && cleaned.length - lastSep - 1 <= 2;
  const integer = (hasDecimals ? cleaned.slice(0, lastSep) : cleaned).replace(/[.,]/g, "");
  const decimals = hasDecimals ? cleaned.slice(lastSep + 1).padEnd(2, "0") : "00";
  const cents = Number(`${integer || "0"}${decimals}`);
  return Number.isFinite(cents) ? cents : null;
}
