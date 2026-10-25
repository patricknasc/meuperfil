import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getPublicStoreByHandle } from "@/lib/store/service";
import { cartItemsSchema, quoteShipping, StoreOrderError } from "@/lib/store/orders";
import { allowRequest } from "@/lib/store/request-limit";
import { getRequestIp, hashClickIp } from "@/lib/tracking/server";

interface RouteProps {
  params: Promise<{ handle: string }>;
}

const bodySchema = z.object({
  items: cartItemsSchema,
  zip: z.string().max(12).optional().nullable(),
  locale: z.enum(["pt", "en", "es"]).default("pt"),
});

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { handle } = await params;
  if (!(await allowRequest(`shipping:${hashClickIp(getRequestIp(request))}`, 30, 600))) {
    return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  const data = await getPublicStoreByHandle(handle);
  if (!data) return NextResponse.json({ success: false, error: "Loja não encontrada" }, { status: 404 });

  try {
    const input = bodySchema.parse(await request.json());
    const quote = await quoteShipping(data.store, input.items, input.zip ?? null, input.locale);
    return NextResponse.json({ success: true, data: quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    if (error instanceof StoreOrderError || (error instanceof Error && /frete/.test(error.message))) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Error quoting shipping:", error);
    return NextResponse.json({ success: false, error: "Erro ao calcular o frete" }, { status: 500 });
  }
}
