import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    store: { findUnique: vi.fn() },
    workspace: { findUnique: vi.fn() },
    product: { count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    productCategory: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));

import { formatPrice, parsePriceInput } from "../lib/store/money";
import { productSchema, slugify, updateStoreSchema, catalogQuerySchema } from "../lib/store/validation";
import { detectImageType, isWorkspaceMediaPath } from "../lib/storage/media";
import { parseBlockConfig } from "../lib/profiles/validation";
import { createProduct, getProduct, searchCatalog } from "../lib/store/service";

const physical = {
  type: "PHYSICAL",
  name: "Camiseta Básica",
  priceCents: 4990,
  weightGrams: 300,
  heightCm: 4,
  widthCm: 25,
  lengthCm: 30,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ENCRYPTION_KEY = "a".repeat(64);
});

describe("store helpers", () => {
  it("slugifies names with accents and symbols", () => {
    expect(slugify("Camiseta Básica — Azul!")).toBe("camiseta-basica-azul");
    expect(slugify("  Ação & Reação  ")).toBe("acao-reacao");
  });

  it("parses prices typed in Brazilian or US format", () => {
    expect(parsePriceInput("49,90")).toBe(4990);
    expect(parsePriceInput("1.249,90")).toBe(124990);
    expect(parsePriceInput("49.9")).toBe(4990);
    expect(parsePriceInput("R$ 15")).toBe(1500);
    expect(parsePriceInput("1.000")).toBe(100000);
    expect(parsePriceInput("abc")).toBeNull();
  });

  it("formats BRL prices for each locale", () => {
    expect(formatPrice(4990, "pt")).toMatch(/R\$\s?49,90/);
    expect(formatPrice(4990, "en")).toContain("49.90");
  });

  it("detects images by signature, not by declared type", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(detectImageType(png)?.ext).toBe("png");
    expect(detectImageType(jpeg)?.ext).toBe("jpg");
    expect(detectImageType(webp)?.ext).toBe("webp");
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("only accepts media paths uploaded for the same workspace", () => {
    const path = "ws1/123e4567-e89b-12d3-a456-426614174000.png";
    expect(isWorkspaceMediaPath("ws1", path)).toBe(true);
    expect(isWorkspaceMediaPath("ws2", path)).toBe(false);
    expect(isWorkspaceMediaPath("ws1", "ws1/../ws2/123e4567-e89b-12d3-a456-426614174000.png")).toBe(false);
  });
});

describe("store validation", () => {
  it("requires package size for physical products only", () => {
    expect(productSchema.safeParse(physical).success).toBe(true);
    const missing = productSchema.safeParse({ ...physical, weightGrams: null });
    expect(missing.success).toBe(false);
    expect(productSchema.safeParse({ type: "SERVICE", name: "Consultoria", priceCents: 20000 }).success).toBe(true);
  });

  it("rejects a compare-at price that is not higher than the price", () => {
    expect(productSchema.safeParse({ ...physical, compareAtCents: 4990 }).success).toBe(false);
    expect(productSchema.safeParse({ ...physical, compareAtCents: 5990 }).success).toBe(true);
  });

  it("rejects non-https digital delivery links", () => {
    const base = { type: "DIGITAL", name: "E-book", priceCents: 2990 };
    expect(productSchema.safeParse({ ...base, digitalDeliveryUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, digitalDeliveryUrl: "https://drive.example.com/x" }).success).toBe(true);
  });

  it("requires the details for each enabled checkout option", () => {
    const base = { name: "Loja", acceptWhatsapp: false, acceptPixDirect: false, pickupEnabled: false, quoteShipping: false };
    expect(updateStoreSchema.safeParse(base).success).toBe(true);
    expect(updateStoreSchema.safeParse({ ...base, acceptWhatsapp: true }).success).toBe(false);
    const ok = updateStoreSchema.parse({ ...base, acceptWhatsapp: true, whatsappPhone: "(11) 99999-8888" });
    expect(ok.whatsappPhone).toBe("5511999998888");
    expect(updateStoreSchema.safeParse({ ...base, acceptPixDirect: true, pixKey: "a@b.com" }).success).toBe(false);
    expect(updateStoreSchema.safeParse({ ...base, quoteShipping: true, originZip: "01310-100" }).success).toBe(true);
    expect(updateStoreSchema.safeParse({ ...base, quoteShipping: true, originZip: "123" }).success).toBe(false);
  });

  it("ignores malformed catalog query parameters instead of failing the page", () => {
    expect(catalogQuerySchema.parse({ sort: "hack", page: "-3", min: "abc", type: "X" })).toEqual({});
    expect(catalogQuerySchema.parse({ q: "camiseta", page: "2", min: "10" })).toEqual({ q: "camiseta", page: 2, min: 10 });
  });

  it("validates block config according to the block type", () => {
    expect(parseBlockConfig("STORE", { limit: 4 })).toEqual({ mode: "featured", limit: 4 });
    expect(() => parseBlockConfig("STORE", { limit: 50 })).toThrow();
    expect(() => parseBlockConfig("SOCIAL_LINKS", { links: [] })).toThrow();
    expect(parseBlockConfig("LINK", { anything: true })).toBeNull();
    expect(parseBlockConfig("LINK", undefined)).toBeUndefined();
  });
});

describe("store service", () => {
  it("refuses images that belong to another workspace", async () => {
    mockPrisma.store.findUnique.mockResolvedValue({ id: "store1", workspaceId: "ws1" });
    mockPrisma.workspace.findUnique.mockResolvedValue({ plan: "FREE", subscriptionStatus: "NONE" });
    mockPrisma.product.count.mockResolvedValue(0);
    mockPrisma.product.findUnique.mockResolvedValue(null);

    const input = productSchema.parse({
      ...physical,
      images: [{ storagePath: "ws2/123e4567-e89b-12d3-a456-426614174000.png" }],
    });
    await expect(createProduct("ws1", input)).rejects.toThrow("Imagem inválida");
    expect(mockPrisma.product.create).not.toHaveBeenCalled();
  });

  it("enforces the plan product limit", async () => {
    mockPrisma.store.findUnique.mockResolvedValue({ id: "store1", workspaceId: "ws1" });
    mockPrisma.workspace.findUnique.mockResolvedValue({ plan: "FREE", subscriptionStatus: "NONE" });
    mockPrisma.product.count.mockResolvedValue(10);
    await expect(createProduct("ws1", productSchema.parse(physical))).rejects.toThrow(/até 10 produtos/);
  });

  it("encrypts digital links at rest and decrypts them for the owner", async () => {
    mockPrisma.store.findUnique.mockResolvedValue({ id: "store1", workspaceId: "ws1" });
    mockPrisma.workspace.findUnique.mockResolvedValue({ plan: "PRO", subscriptionStatus: "ACTIVE" });
    mockPrisma.product.count.mockResolvedValue(0);
    mockPrisma.product.findUnique.mockResolvedValue(null);
    mockPrisma.product.create.mockImplementation(async ({ data }) => ({ ...data, id: "p1", images: [], category: null }));

    const product = await createProduct(
      "ws1",
      productSchema.parse({ type: "DIGITAL", name: "E-book", priceCents: 2990, digitalDeliveryUrl: "https://files.example.com/ebook.pdf" })
    );
    const stored = mockPrisma.product.create.mock.calls[0][0].data.digitalDeliveryUrlEnc;
    expect(stored).toBeTruthy();
    expect(stored).not.toContain("example.com");
    expect(product.digitalDeliveryUrl).toBe("https://files.example.com/ebook.pdf");
    expect(product).not.toHaveProperty("digitalDeliveryUrlEnc");
  });

  it("scopes owner reads to the workspace", async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);
    expect(await getProduct("ws1", "p-from-ws2")).toBeNull();
    expect(mockPrisma.product.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "p-from-ws2", workspaceId: "ws1" } }));
  });

  it("only lists active products of the store in the public catalog", async () => {
    mockPrisma.product.findMany.mockResolvedValue([]);
    mockPrisma.product.count.mockResolvedValue(0);
    mockPrisma.productCategory.findMany.mockResolvedValue([]);
    await searchCatalog("store1", { q: "Azul", min: 10, sort: "price_asc" });
    const args = mockPrisma.product.findMany.mock.calls[0][0];
    expect(args.where.AND).toEqual(
      expect.arrayContaining([{ storeId: "store1", isActive: true }, { priceCents: { gte: 1000 } }])
    );
    expect(args.orderBy).toEqual([{ priceCents: "asc" }]);
    expect(args.select).not.toHaveProperty("digitalDeliveryUrlEnc");
  });
});
