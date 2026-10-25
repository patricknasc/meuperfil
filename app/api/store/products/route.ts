import { NextRequest, NextResponse } from "next/server";
import { withStoreOwner } from "@/lib/store/api";
import { createProduct, ensureStore, listProducts } from "@/lib/store/service";
import { productSchema } from "@/lib/store/validation";

export async function GET(request: NextRequest) {
  return withStoreOwner("listar produtos", async (context) => {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const data = await listProducts(context.workspaceId, {
      search: params.get("search")?.trim().slice(0, 100) || undefined,
      categoryId: params.get("categoryId") || undefined,
      page,
    });
    return NextResponse.json({ success: true, data });
  });
}

export async function POST(request: NextRequest) {
  return withStoreOwner("criar o produto", async (context) => {
    const input = productSchema.parse(await request.json());
    await ensureStore(context.workspaceId, context.workspace.name);
    const product = await createProduct(context.workspaceId, input);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  });
}
