import { prisma } from "@/lib/db/client";
import { Prisma } from "@/app/generated/prisma/client";
import { getEffectivePlan, PLAN_LIMITS } from "@/lib/billing/plans";
import { decryptToken, encryptToken } from "@/lib/meta/oauth";
import { deleteImages, isWorkspaceMediaPath, publicMediaUrl } from "@/lib/storage/media";
import { sanitizeHandle } from "@/lib/profiles/validation";
import {
  slugify,
  type CatalogQuery,
  type CategoryInput,
  type ProductInput,
  type StoreBlockConfig,
  type UpdateStoreInput,
} from "@/lib/store/validation";

export const CATALOG_PAGE_SIZE = 24;

const productInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithImages = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

// ─── Store ──────────────────────────────────────────────────────────────────

export async function getStoreForWorkspace(workspaceId: string) {
  return prisma.store.findUnique({ where: { workspaceId } });
}

/** The store is created lazily the first time the owner opens it. */
export async function ensureStore(workspaceId: string, defaultName: string) {
  return prisma.store.upsert({
    where: { workspaceId },
    create: { workspaceId, name: defaultName.slice(0, 80) || "Minha loja" },
    update: {},
  });
}

export async function updateStore(workspaceId: string, input: UpdateStoreInput) {
  return prisma.store.update({
    where: { workspaceId },
    data: input,
  });
}

// ─── Limits ─────────────────────────────────────────────────────────────────

export async function canAddProduct(workspaceId: string) {
  const [workspace, currentCount] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true, subscriptionStatus: true },
    }),
    prisma.product.count({ where: { workspaceId } }),
  ]);
  if (!workspace) return { allowed: false, currentCount, limit: 0 };
  const limit = PLAN_LIMITS[getEffectivePlan(workspace.plan, workspace.subscriptionStatus)].maxProducts;
  return { allowed: currentCount < limit, currentCount, limit };
}

// ─── Categories ─────────────────────────────────────────────────────────────

async function requireStore(workspaceId: string) {
  const store = await getStoreForWorkspace(workspaceId);
  if (!store) throw new Error("Loja não encontrada");
  return store;
}

async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = base || "item";
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function listCategories(workspaceId: string) {
  const store = await getStoreForWorkspace(workspaceId);
  if (!store) return [];
  return prisma.productCategory.findMany({
    where: { storeId: store.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(workspaceId: string, input: CategoryInput) {
  const store = await requireStore(workspaceId);
  const slug = await uniqueSlug(slugify(input.name), async (s) =>
    Boolean(await prisma.productCategory.findUnique({ where: { storeId_slug: { storeId: store.id, slug: s } } }))
  );
  return prisma.productCategory.create({
    data: { storeId: store.id, name: input.name, slug, sortOrder: input.sortOrder ?? 0 },
  });
}

export async function updateCategory(workspaceId: string, categoryId: string, input: CategoryInput) {
  const store = await requireStore(workspaceId);
  const result = await prisma.productCategory.updateMany({
    where: { id: categoryId, storeId: store.id },
    data: { name: input.name, ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}) },
  });
  if (!result.count) throw new Error("Categoria não encontrada");
}

export async function deleteCategory(workspaceId: string, categoryId: string) {
  const store = await requireStore(workspaceId);
  const result = await prisma.productCategory.deleteMany({ where: { id: categoryId, storeId: store.id } });
  if (!result.count) throw new Error("Categoria não encontrada");
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function listProducts(
  workspaceId: string,
  filters: { search?: string; categoryId?: string; page?: number } = {}
) {
  const store = await getStoreForWorkspace(workspaceId);
  if (!store) return { products: [], total: 0 };
  const where: Prisma.ProductWhereInput = {
    storeId: store.id,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { sku: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const page = filters.page ?? 1;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 50,
      skip: (page - 1) * 50,
    }),
    prisma.product.count({ where }),
  ]);
  return { products: products.map(toOwnerProduct), total };
}

export async function getProduct(workspaceId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, workspaceId },
    include: productInclude,
  });
  return product ? toOwnerProduct(product) : null;
}

/** Owner view: decrypts the digital delivery link and never leaks the ciphertext. */
function toOwnerProduct(product: ProductWithImages) {
  const { digitalDeliveryUrlEnc, ...rest } = product;
  let digitalDeliveryUrl: string | null = null;
  if (digitalDeliveryUrlEnc) {
    try {
      digitalDeliveryUrl = decryptToken(digitalDeliveryUrlEnc);
    } catch {
      digitalDeliveryUrl = null;
    }
  }
  return { ...rest, digitalDeliveryUrl };
}

function productData(input: ProductInput, storeId: string, categoryId: string | null) {
  const isPhysical = input.type === "PHYSICAL";
  return {
    type: input.type,
    name: input.name,
    description: input.description,
    priceCents: input.priceCents,
    compareAtCents: input.compareAtCents ?? null,
    stock: input.stock ?? null,
    sku: input.sku,
    categoryId,
    tags: [...new Set(input.tags.map((t) => t.toLowerCase()))],
    weightGrams: isPhysical ? input.weightGrams ?? null : null,
    heightCm: isPhysical ? input.heightCm ?? null : null,
    widthCm: isPhysical ? input.widthCm ?? null : null,
    lengthCm: isPhysical ? input.lengthCm ?? null : null,
    digitalDeliveryUrlEnc:
      input.type === "DIGITAL" && input.digitalDeliveryUrl ? encryptToken(input.digitalDeliveryUrl) : null,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    storeId,
  };
}

async function resolveCategory(storeId: string, categoryId: string | null | undefined) {
  if (!categoryId) return null;
  const category = await prisma.productCategory.findFirst({ where: { id: categoryId, storeId }, select: { id: true } });
  if (!category) throw new Error("Categoria não encontrada");
  return category.id;
}

function imageRows(workspaceId: string, images: ProductInput["images"]) {
  return images.map((image, index) => {
    if (!isWorkspaceMediaPath(workspaceId, image.storagePath)) {
      throw new Error("Imagem inválida");
    }
    return { storagePath: image.storagePath, url: publicMediaUrl(image.storagePath), alt: image.alt, sortOrder: index };
  });
}

export async function createProduct(workspaceId: string, input: ProductInput) {
  const store = await requireStore(workspaceId);
  const limit = await canAddProduct(workspaceId);
  if (!limit.allowed) {
    throw new Error(`Seu plano permite até ${limit.limit} produtos. Faça upgrade para cadastrar mais.`);
  }
  const categoryId = await resolveCategory(store.id, input.categoryId);
  const slug = await uniqueSlug(input.slug || slugify(input.name), async (s) =>
    Boolean(await prisma.product.findUnique({ where: { storeId_slug: { storeId: store.id, slug: s } } }))
  );
  const images = imageRows(workspaceId, input.images);

  const product = await prisma.product.create({
    data: {
      ...productData(input, store.id, categoryId),
      workspaceId,
      slug,
      images: { create: images },
    },
    include: productInclude,
  });
  return toOwnerProduct(product);
}

export async function updateProduct(workspaceId: string, productId: string, input: ProductInput) {
  const store = await requireStore(workspaceId);
  const existing = await prisma.product.findFirst({
    where: { id: productId, workspaceId },
    include: { images: true },
  });
  if (!existing) throw new Error("Produto não encontrado");

  const categoryId = await resolveCategory(store.id, input.categoryId);
  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueSlug(input.slug, async (s) =>
          Boolean(await prisma.product.findUnique({ where: { storeId_slug: { storeId: store.id, slug: s } } }))
        )
      : existing.slug;
  const images = imageRows(workspaceId, input.images);
  const data = productData(input, store.id, categoryId);
  // Keep the stored delivery link when the owner saves without retyping it.
  if (input.type === "DIGITAL" && input.digitalDeliveryUrl === undefined) {
    data.digitalDeliveryUrlEnc = existing.digitalDeliveryUrlEnc;
  }

  const product = await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId } });
    return tx.product.update({
      where: { id: productId },
      data: { ...data, slug, images: { create: images } },
      include: productInclude,
    });
  });

  const kept = new Set(images.map((i) => i.storagePath));
  await deleteImages(existing.images.map((i) => i.storagePath ?? "").filter((p) => p && !kept.has(p)));
  return toOwnerProduct(product);
}

export async function deleteProduct(workspaceId: string, productId: string) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, workspaceId },
    include: { images: true },
  });
  if (!existing) throw new Error("Produto não encontrado");
  await prisma.product.delete({ where: { id: productId } });
  await deleteImages(existing.images.map((i) => i.storagePath ?? ""));
}

// ─── Public catalog ─────────────────────────────────────────────────────────

const publicProductSelect = {
  id: true,
  type: true,
  name: true,
  slug: true,
  description: true,
  priceCents: true,
  compareAtCents: true,
  stock: true,
  tags: true,
  isFeatured: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
} satisfies Prisma.ProductSelect;

export type PublicProduct = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;

/** Published profile plus its workspace store, or null when the store has nothing to show. */
export async function getPublicStoreByHandle(handle: string) {
  const profile = await prisma.profile.findUnique({
    where: { handle: sanitizeHandle(handle) },
    select: {
      id: true,
      workspaceId: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      theme: true,
      themeSettings: true,
      isPublished: true,
    },
  });
  if (!profile || !profile.isPublished) return null;
  const store = await prisma.store.findUnique({ where: { workspaceId: profile.workspaceId } });
  if (!store) return null;
  return { profile, store };
}

export async function searchCatalog(storeId: string, query: CatalogQuery) {
  const and: Prisma.ProductWhereInput[] = [{ storeId, isActive: true }];
  if (query.q) {
    and.push({
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { tags: { has: query.q.toLowerCase() } },
      ],
    });
  }
  if (query.category) and.push({ category: { slug: query.category } });
  if (query.type) and.push({ type: query.type });
  if (query.min !== undefined) and.push({ priceCents: { gte: query.min * 100 } });
  if (query.max !== undefined) and.push({ priceCents: { lte: query.max * 100 } });

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    query.sort === "price_asc"
      ? [{ priceCents: "asc" }]
      : query.sort === "price_desc"
        ? [{ priceCents: "desc" }]
        : query.sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];

  const page = query.page ?? 1;
  const where = { AND: and };
  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      select: publicProductSelect,
      orderBy,
      take: CATALOG_PAGE_SIZE,
      skip: (page - 1) * CATALOG_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.productCategory.findMany({
      where: { storeId, products: { some: { isActive: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
  ]);
  return { products, total, categories, page, pageCount: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)) };
}

export async function getPublicProduct(storeId: string, slug: string) {
  return prisma.product.findFirst({
    where: { storeId, slug, isActive: true },
    select: publicProductSelect,
  });
}

/** Products for a STORE block on the bio page. */
export async function getStoreBlockProducts(workspaceId: string, config: StoreBlockConfig) {
  const store = await getStoreForWorkspace(workspaceId);
  if (!store) return [];
  const where: Prisma.ProductWhereInput = {
    storeId: store.id,
    isActive: true,
    ...(config.mode === "category" && config.categoryId ? { categoryId: config.categoryId } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    config.mode === "newest"
      ? [{ createdAt: "desc" }]
      : [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];
  return prisma.product.findMany({ where, select: publicProductSelect, orderBy, take: config.limit });
}
