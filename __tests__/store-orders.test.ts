import { describe, expect, it } from "vitest";
import { buildPixPayload, crc16, isValidPixKey, normalizePixKey } from "../lib/store/pix";
import { buildWhatsAppOrderMessage, whatsAppLink } from "../lib/store/whatsapp";
import { canTransition, nextStatuses } from "../lib/store/order-status";
import { addressSchema, buildShippingOptions, formatAddress } from "../lib/store/shipping";
import { packageKey, toCarrierQuotes } from "../lib/store/melhor-envio";
import { placeOrderSchema } from "../lib/store/orders";

describe("Pix BR Code", () => {
  it("matches the static example from the BACEN manual", () => {
    expect(
      buildPixPayload({
        key: "123e4567-e12b-12d1-a456-426655440000",
        keyType: "RANDOM",
        merchantName: "Fulano de Tal",
        merchantCity: "BRASILIA",
      })
    ).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D"
    );
  });

  it("includes amount and txid and ends with a valid CRC", () => {
    const payload = buildPixPayload({
      key: "(11) 99999-8888",
      keyType: "PHONE",
      merchantName: "Ateliê São João",
      merchantCity: "São Paulo",
      amountCents: 12990,
      txid: "PED42",
    });
    expect(payload).toContain("0114+5511999998888");
    expect(payload).toContain("5406129.90");
    expect(payload).toContain("5915Atelie Sao Joao");
    expect(payload).toContain("6009Sao Paulo");
    expect(payload).toContain("62090505PED42");
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });

  it("normalizes and validates keys per type", () => {
    expect(normalizePixKey("123.456.789-09", "CPF")).toBe("12345678909");
    expect(isValidPixKey("123.456.789-09", "CPF")).toBe(true);
    expect(isValidPixKey("12.345.678/0001-90", "CNPJ")).toBe(true);
    expect(isValidPixKey("Loja@Exemplo.com", "EMAIL")).toBe(true);
    expect(isValidPixKey("11 99999-8888", "PHONE")).toBe(true);
    expect(isValidPixKey("123", "CPF")).toBe(false);
    expect(isValidPixKey("not-a-uuid", "RANDOM")).toBe(false);
  });
});

describe("WhatsApp order message", () => {
  it("lists items, delivery, total and the order link", () => {
    const text = buildWhatsAppOrderMessage({
      number: 7,
      customerName: "Ana",
      items: [
        { name: "Camiseta", quantity: 2, unitPriceCents: 4990 },
        { name: "E-book", quantity: 1, unitPriceCents: 2990 },
      ],
      shippingLabel: "Correios PAC",
      shippingCents: 2150,
      totalCents: 15120,
      orderUrl: "https://meuperfil.me/pt/loja/pedido/abc",
      customerNote: "Presente",
    });
    expect(text).toContain("Pedido #7");
    expect(text).toMatch(/2× Camiseta — R\$\s?99,80/);
    expect(text).toMatch(/Entrega: Correios PAC — R\$\s?21,50/);
    expect(text).toMatch(/\*Total: R\$\s?151,20\*/);
    expect(text).toContain("Observação: Presente");
    expect(text).toContain("https://meuperfil.me/pt/loja/pedido/abc");
    expect(whatsAppLink("55 11 99999-8888", "a b&c")).toBe("https://wa.me/5511999998888?text=a%20b%26c");
  });
});

describe("order status machine", () => {
  it("allows paying or canceling unpaid orders only", () => {
    expect(canTransition("AWAITING_PAYMENT", "PAID")).toBe(true);
    expect(canTransition("PENDING", "CANCELED")).toBe(true);
    expect(canTransition("PAID", "CANCELED")).toBe(false);
    expect(canTransition("PAID", "REFUNDED")).toBe(true);
    expect(canTransition("SHIPPED", "PAID")).toBe(false);
    expect(nextStatuses("CANCELED")).toEqual([]);
    expect(nextStatuses("REFUNDED")).toEqual([]);
  });
});

describe("shipping options", () => {
  const rules = { pickupEnabled: true, pickupAddress: "Rua A, 1", flatShippingCents: 1500, freeShippingOverCents: 20000, quoteShipping: true };
  const quotes = [{ serviceId: "1", label: "Correios PAC", priceCents: 2150, days: 6 }];

  it("offers no delivery for digital-only carts", () => {
    expect(buildShippingOptions(rules, 5000, false, quotes)).toEqual([expect.objectContaining({ id: "none", priceCents: 0 })]);
  });

  it("combines pickup, flat rate and carrier quotes", () => {
    const options = buildShippingOptions(rules, 5000, true, quotes);
    expect(options.map((o) => [o.id, o.priceCents])).toEqual([
      ["pickup", 0],
      ["flat", 1500],
      ["quote:1", 2150],
    ]);
    expect(options[0].label).toContain("Rua A, 1");
  });

  it("zeroes paid delivery above the free shipping threshold", () => {
    const options = buildShippingOptions(rules, 20000, true, quotes, "en");
    expect(options.filter((o) => o.kind !== "pickup").every((o) => o.priceCents === 0 && o.label.includes("free"))).toBe(true);
  });

  it("parses Melhor Envio services, skipping unavailable ones", () => {
    const parsed = toCarrierQuotes([
      { id: 2, name: "SEDEX", price: "35.90", delivery_time: 2, company: { name: "Correios" } },
      { id: 1, name: "PAC", custom_price: "21.50", price: "22.00", custom_delivery_time: 7, company: { name: "Correios" } },
      { id: 3, name: ".Package", error: "Transportadora não atende este trecho." },
    ]);
    expect(parsed).toEqual([
      { serviceId: "1", label: "Correios PAC", priceCents: 2150, days: 7 },
      { serviceId: "2", label: "Correios SEDEX", priceCents: 3590, days: 2 },
    ]);
  });

  it("keys quotes by products and quantities, not order", () => {
    expect(packageKey([{ productId: "a", quantity: 1 }, { productId: "b", quantity: 2 }])).toBe(
      packageKey([{ productId: "b", quantity: 2 }, { productId: "a", quantity: 1 }])
    );
    expect(packageKey([{ productId: "a", quantity: 1 }])).not.toBe(packageKey([{ productId: "a", quantity: 2 }]));
  });

  it("validates and formats addresses", () => {
    const address = addressSchema.parse({ zip: "01310-100", street: "Av. Paulista", number: "1000", district: "Bela Vista", city: "São Paulo", state: "sp" });
    expect(address.state).toBe("SP");
    expect(formatAddress(address)).toBe("Av. Paulista, 1000, Bela Vista, São Paulo/SP, CEP 01310-100");
    expect(addressSchema.safeParse({ ...address, zip: "123" }).success).toBe(false);
  });
});

describe("order input", () => {
  const base = {
    items: [{ productId: "p1", quantity: 1 }],
    channel: "WHATSAPP",
    customer: { name: "Ana Souza", phone: "(11) 98888-7777" },
    shippingOptionId: "none",
  };

  it("normalizes the phone and accepts an empty email", () => {
    const parsed = placeOrderSchema.parse({ ...base, customer: { ...base.customer, email: "" } });
    expect(parsed.customer.phone).toBe("11988887777");
    expect(parsed.customer.email).toBeNull();
    expect(parsed.locale).toBe("pt");
  });

  it("rejects bots that fill the honeypot and unsupported channels", () => {
    expect(placeOrderSchema.safeParse({ ...base, website: "spam.example" }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, channel: "PLATFORM" }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });
});
