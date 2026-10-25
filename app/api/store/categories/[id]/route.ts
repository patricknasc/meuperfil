import { NextRequest, NextResponse } from "next/server";
import { withStoreOwner } from "@/lib/store/api";
import { deleteCategory, updateCategory } from "@/lib/store/service";
import { categorySchema } from "@/lib/store/validation";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  return withStoreOwner("salvar a categoria", async (context) => {
    await updateCategory(context.workspaceId, id, categorySchema.parse(await request.json()));
    return NextResponse.json({ success: true });
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  return withStoreOwner("excluir a categoria", async (context) => {
    await deleteCategory(context.workspaceId, id);
    return NextResponse.json({ success: true });
  });
}
