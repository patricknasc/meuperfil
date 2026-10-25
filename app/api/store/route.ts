import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { withStoreOwner } from "@/lib/store/api";
import { canAddProduct, ensureStore, listCategories, updateStore } from "@/lib/store/service";
import { updateStoreSchema } from "@/lib/store/validation";

export async function GET() {
  return withStoreOwner("carregar a loja", async (context) => {
    const store = await ensureStore(context.workspaceId, context.workspace.name);
    const [categories, limits, profiles] = await Promise.all([
      listCategories(context.workspaceId),
      canAddProduct(context.workspaceId),
      prisma.profile.findMany({
        where: { workspaceId: context.workspaceId },
        select: { handle: true, isPublished: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return NextResponse.json({ success: true, data: { store, categories, limits, profiles } });
  });
}

export async function PUT(request: NextRequest) {
  return withStoreOwner("salvar a loja", async (context) => {
    const input = updateStoreSchema.parse(await request.json());
    await ensureStore(context.workspaceId, context.workspace.name);
    const store = await updateStore(context.workspaceId, input);
    return NextResponse.json({ success: true, data: store });
  });
}
