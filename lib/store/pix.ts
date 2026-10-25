/**
 * Static Pix "copia e cola" (BR Code) following the BACEN EMV QRCPS spec.
 * The amount and txid are fixed per order, so the buyer's bank app fills
 * everything in; confirming the payment is up to the seller.
 */

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

export interface PixPayloadInput {
  key: string;
  keyType: PixKeyType;
  merchantName: string;
  merchantCity: string;
  amountCents?: number;
  /** Up to 25 letters/digits; "***" when the payment has no identifier. */
  txid?: string;
}

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as required by the spec. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(payload)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Bank apps only accept plain ASCII in name and city. */
function ascii(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,-]/g, "")
    .trim()
    .slice(0, max);
}

export function normalizePixKey(key: string, type: PixKeyType): string {
  const value = key.trim();
  switch (type) {
    case "CPF":
    case "CNPJ":
      return value.replace(/\D/g, "");
    case "EMAIL":
      return value.toLowerCase();
    case "PHONE": {
      const digits = value.replace(/\D/g, "");
      return `+${digits.length <= 11 ? `55${digits}` : digits}`;
    }
    case "RANDOM":
      return value.toLowerCase();
  }
}

export function isValidPixKey(key: string, type: PixKeyType): boolean {
  const value = normalizePixKey(key, type);
  switch (type) {
    case "CPF":
      return /^\d{11}$/.test(value);
    case "CNPJ":
      return /^\d{14}$/.test(value);
    case "EMAIL":
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 77;
    case "PHONE":
      return /^\+\d{12,13}$/.test(value);
    case "RANDOM":
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
  }
}

export function buildPixPayload(input: PixPayloadInput): string {
  const txid = (input.txid ?? "***").replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***";
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", normalizePixKey(input.key, input.keyType));

  const body =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    (input.amountCents ? field("54", (input.amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", ascii(input.merchantName, 25) || "Recebedor") +
    field("60", ascii(input.merchantCity, 15) || "Brasil") +
    field("62", field("05", txid)) +
    "6304";

  return body + crc16(body);
}
