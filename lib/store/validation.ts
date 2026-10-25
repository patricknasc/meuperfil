import { z } from "zod";
import { PixKeyType, ProductType } from "@/app/generated/prisma/client";
import { normalizeWhatsApp } from "@/lib/profiles/links";
import { isValidDestinationUrl } from "@/lib/profiles/validation";

export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_PRICE_CENTS = 100_000_000; // R$ 1.000.000,00

/** "Camiseta Básica Azul" → "camiseta-basica-azul" */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeZip(value: string): string {
  return value.replace(/\D/g, "");
}

const cents = z.number().int().min(0).max(MAX_PRICE_CENTS);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const dimension = z.number().int().min(1).max(200).optional().nullable();

const zipSchema = z
  .string()
  .transform(normalizeZip)
  .refine((v) => v.length === 8, "CEP inválido. Use 8 dígitos.");

const whatsappSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const result = normalizeWhatsApp(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: "Número de WhatsApp inválido. Use DDD e número, ex.: 11 99999-8888." });
      return z.NEVER;
    }
    return result.url.replace("https://wa.me/", "");
  });

export const updateStoreSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da loja").max(80),
    description: optionalText(500),
    whatsappPhone: whatsappSchema.optional().nullable(),
    pixKey: optionalText(140),
    pixKeyType: z.nativeEnum(PixKeyType).optional().nullable(),
    pixMerchantName: optionalText(25),
    pixMerchantCity: optionalText(15),
    acceptWhatsapp: z.boolean(),
    acceptPixDirect: z.boolean(),
    originZip: zipSchema.optional().nullable(),
    pickupEnabled: z.boolean(),
    pickupAddress: optionalText(300),
    flatShippingCents: cents.optional().nullable(),
    freeShippingOverCents: cents.optional().nullable(),
    quoteShipping: z.boolean(),
    returnPolicy: optionalText(2000),
    orderExpiryHours: z.number().int().min(1).max(720).optional(),
  })
  .superRefine((store, ctx) => {
    if (store.acceptWhatsapp && !store.whatsappPhone) {
      ctx.addIssue({ code: "custom", path: ["whatsappPhone"], message: "Informe o WhatsApp para receber pedidos por lá." });
    }
    if (store.acceptPixDirect && (!store.pixKey || !store.pixKeyType || !store.pixMerchantName || !store.pixMerchantCity)) {
      ctx.addIssue({
        code: "custom",
        path: ["pixKey"],
        message: "Para receber por Pix, informe a chave, o tipo, o nome e a cidade do recebedor.",
      });
    }
    if (store.quoteShipping && !store.originZip) {
      ctx.addIssue({ code: "custom", path: ["originZip"], message: "Informe o CEP de origem para calcular o frete." });
    }
    if (store.pickupEnabled && !store.pickupAddress) {
      ctx.addIssue({ code: "custom", path: ["pickupAddress"], message: "Informe o endereço de retirada." });
    }
  });

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria").max(60),
  sortOrder: z.number().int().optional(),
});

/** Images are referenced by the storage path returned from the upload route; the URL is derived on the server. */
export const productImageInputSchema = z.object({
  storagePath: z.string().min(1).max(300),
  alt: optionalText(200),
});

const productBaseSchema = z.object({
  type: z.nativeEnum(ProductType),
  name: z.string().trim().min(1, "Informe o nome do produto").max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .nullable()
    .transform((v) => (v ? slugify(v) : null)),
  description: optionalText(5000),
  priceCents: cents.refine((v) => v > 0, "Informe um preço maior que zero"),
  compareAtCents: cents.optional().nullable(),
  stock: z.number().int().min(0).max(1_000_000).optional().nullable(),
  sku: optionalText(60),
  categoryId: z.string().min(1).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  weightGrams: z.number().int().min(1).max(30_000).optional().nullable(),
  heightCm: dimension,
  widthCm: dimension,
  lengthCm: dimension,
  digitalDeliveryUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .refine((v) => !v || isValidDestinationUrl(v), "O link de entrega deve começar com https://"),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  images: z.array(productImageInputSchema).max(MAX_IMAGES_PER_PRODUCT, `Até ${MAX_IMAGES_PER_PRODUCT} imagens por produto`).optional().default([]),
});

function refineProduct(product: z.infer<typeof productBaseSchema>, ctx: z.RefinementCtx) {
  if (product.compareAtCents != null && product.compareAtCents <= product.priceCents) {
    ctx.addIssue({ code: "custom", path: ["compareAtCents"], message: "O preço “de” precisa ser maior que o preço de venda." });
  }
  if (product.type === "PHYSICAL") {
    for (const field of ["weightGrams", "heightCm", "widthCm", "lengthCm"] as const) {
      if (!product[field]) {
        ctx.addIssue({ code: "custom", path: [field], message: "Produtos físicos precisam de peso e medidas para o frete." });
        break;
      }
    }
  }
}

export const productSchema = productBaseSchema.superRefine(refineProduct);

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;

export const PRODUCT_SORTS = ["relevance", "newest", "price_asc", "price_desc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(80).optional().catch(undefined),
  type: z.nativeEnum(ProductType).optional().catch(undefined),
  min: z.coerce.number().int().min(0).optional().catch(undefined),
  max: z.coerce.number().int().min(0).optional().catch(undefined),
  sort: z.enum(PRODUCT_SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export { storeBlockConfigSchema, type StoreBlockConfig } from "@/lib/profiles/validation";
