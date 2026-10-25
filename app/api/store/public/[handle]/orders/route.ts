import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getBaseUrl } from "@/lib/env";
import { getPublicStoreByHandle } from "@/lib/store/service";
import { placeOrder, placeOrderSchema, StoreOrderError } from "@/lib/store/orders";
import { allowRequest } from "@/lib/store/request-limit";
import { getRequestIp, hashClickIp } from "@/lib/tracking/server";

interface RouteProps {
  params: Promise<{ handle: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { handle } = await params;
  if (!(await allowRequest(`orders:${hashClickIp(getRequestIp(request))}`, 10, 600))) {
    return NextResponse.json({ success: false, error: "Muitos pedidos seguidos. Aguarde alguns minutos." }, { status: 429 });
  }
  const data = await getPublicStoreByHandle(handle);
  if (!data) return NextResponse.json({ success: false, error: "Loja não encontrada" }, { status: 404 });

  try {
    const input = placeOrderSchema.parse(await request.json());
    const result = await placeOrder(
      data.store,
      input,
      (token) => `${getBaseUrl()}/${input.locale}/${data.profile.handle}/pedido/${token}`
    );
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return NextResponse.json({ success: false, error: issue?.message ?? "Dados inválidos", field: issue?.path.join(".") }, { status: 400 });
    }
    if (error instanceof StoreOrderError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error("Error placing order:", error);
    return NextResponse.json({ success: false, error: "Não foi possível registrar o pedido. Tente novamente." }, { status: 500 });
  }
}
