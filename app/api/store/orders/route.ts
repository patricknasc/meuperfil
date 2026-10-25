import { NextRequest, NextResponse } from "next/server";
import { withStoreOwner } from "@/lib/store/api";
import { listOrders, orderFiltersSchema } from "@/lib/store/orders";

export async function GET(request: NextRequest) {
  return withStoreOwner("listar pedidos", async (context) => {
    const filters = orderFiltersSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const data = await listOrders(context.workspaceId, filters);
    return NextResponse.json({ success: true, data });
  });
}
