import { NextRequest, NextResponse } from "next/server";
import { withStoreOwner } from "@/lib/store/api";
import { getOrderForOwner, updateOrderForOwner, updateOrderSchema } from "@/lib/store/orders";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  return withStoreOwner("carregar o pedido", async (context) => {
    const order = await getOrderForOwner(context.workspaceId, id);
    if (!order) throw new Error("Pedido não encontrado");
    return NextResponse.json({ success: true, data: order });
  });
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  return withStoreOwner("atualizar o pedido", async (context) => {
    const input = updateOrderSchema.parse(await request.json());
    const order = await updateOrderForOwner(context.workspaceId, id, input);
    return NextResponse.json({ success: true, data: order });
  });
}
