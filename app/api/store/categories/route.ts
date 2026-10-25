import { NextRequest, NextResponse } from "next/server";
import { withStoreOwner } from "@/lib/store/api";
import { createCategory, ensureStore, listCategories } from "@/lib/store/service";
import { categorySchema } from "@/lib/store/validation";

export async function GET() {
  return withStoreOwner("listar categorias", async (context) => {
    const categories = await listCategories(context.workspaceId);
    return NextResponse.json({ success: true, data: categories });
  });
}

export async function POST(request: NextRequest) {
  return withStoreOwner("criar a categoria", async (context) => {
    const input = categorySchema.parse(await request.json());
    await ensureStore(context.workspaceId, context.workspace.name);
    const category = await createCategory(context.workspaceId, input);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  });
}
