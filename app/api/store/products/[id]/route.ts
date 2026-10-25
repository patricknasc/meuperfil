import { NextRequest, NextResponse } from "next/server";
import { withStoreOwner } from "@/lib/store/api";
import { deleteProduct, getProduct, updateProduct } from "@/lib/store/service";
import { productSchema } from "@/lib/store/validation";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  return withStoreOwner("carregar o produto", async (context) => {
    const product = await getProduct(context.workspaceId, id);
    if (!product) throw new Error("Produto não encontrado");
    return NextResponse.json({ success: true, data: product });
  });
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  return withStoreOwner("salvar o produto", async (context) => {
    const input = productSchema.parse(await request.json());
    const product = await updateProduct(context.workspaceId, id, input);
    return NextResponse.json({ success: true, data: product });
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  return withStoreOwner("excluir o produto", async (context) => {
    await deleteProduct(context.workspaceId, id);
    return NextResponse.json({ success: true });
  });
}
