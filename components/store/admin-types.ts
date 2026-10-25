/** JSON shapes returned by /api/store for the dashboard screens. */

export type ProductTypeValue = "PHYSICAL" | "DIGITAL" | "SERVICE";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { products: number };
}

export interface AdminProductImage {
  id?: string;
  url: string;
  storagePath: string | null;
  alt: string | null;
}

export interface AdminProduct {
  id: string;
  type: ProductTypeValue;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  stock: number | null;
  sku: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  tags: string[];
  weightGrams: number | null;
  heightCm: number | null;
  widthCm: number | null;
  lengthCm: number | null;
  digitalDeliveryUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  images: AdminProductImage[];
}

export interface AdminStore {
  id: string;
  name: string;
  description: string | null;
  whatsappPhone: string | null;
  pixKey: string | null;
  pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM" | null;
  pixMerchantName: string | null;
  pixMerchantCity: string | null;
  acceptWhatsapp: boolean;
  acceptPixDirect: boolean;
  originZip: string | null;
  pickupEnabled: boolean;
  pickupAddress: string | null;
  flatShippingCents: number | null;
  freeShippingOverCents: number | null;
  quoteShipping: boolean;
  returnPolicy: string | null;
  orderExpiryHours: number;
}

export interface AdminStoreData {
  store: AdminStore;
  categories: AdminCategory[];
  limits: { allowed: boolean; currentCount: number; limit: number | null };
  profiles: Array<{ handle: string; isPublished: boolean }>;
}
