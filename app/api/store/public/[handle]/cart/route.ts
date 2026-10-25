import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/client";
import { getPublicStoreByHandle } from "@/lib/store/service";
import { cartItemsSchema, channelAvailable } from "@/lib/store/orders";
import { isMelhorEnvioConfigured } from "@/lib/store/melhor-envio";

interface RouteProps {
  params: Promise<{ handle: string }>;
}

/** Current prices, stock and checkout options for the items in a visitor's cart. */
export async function POST(request: NextRequest, { params }: RouteProps) {
  const { handle } = await params;
  const data = await getPublicStoreByHandle(handle);
  if (!data) return NextResponse.json({ success: false, error: "Loja não encontrada" }, { status: 404 });

  try {
    const body = await request.json();
    const items = cartItemsSchema.parse(body.items);
    const products = await prisma.product.findMany({
      where: { storeId: data.store.id, id: { in: items.map((i) => i.productId) } },
      select: { id: true, name: true, slug: true, priceCents: true, stock: true, isActive: true, type: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } },
    });
    const { store } = data;
    return NextResponse.json({
      success: true,
      data: {
        products: products.map((p) => ({
          productId: p.id,
          name: p.name,
          slug: p.slug,
          priceCents: p.priceCents,
          stock: p.stock,
          available: p.isActive && p.stock !== 0,
          type: p.type,
          imageUrl: p.images[0]?.url ?? null,
        })),
        channels: { WHATSAPP: channelAvailable(store, "WHATSAPP"), PIX_DIRECT: channelAvailable(store, "PIX_DIRECT") },
        quoteShipping: store.quoteShipping && Boolean(store.originZip) && isMelhorEnvioConfigured(),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message ?? "Carrinho inválido" }, { status: 400 });
    }
    console.error("Error loading cart:", error);
    return NextResponse.json({ success: false, error: "Erro ao carregar o carrinho" }, { status: 500 });
  }
}
