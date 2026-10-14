import { NextRequest, NextResponse } from "next/server";
import { getRequestIp, hashClickIp } from "@/lib/tracking/server";
import { recordBlockClick } from "@/lib/profiles/service";

type ClickRouteProps = {
  params: Promise<{ blockId: string }>;
};

export async function GET(request: NextRequest, { params }: ClickRouteProps) {
  const { blockId } = await params;

  const rawIp = getRequestIp(request);
  const ipHash = hashClickIp(rawIp);
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  const index = Number(request.nextUrl.searchParams.get("i") ?? "0");
  const destinationUrl = await recordBlockClick(
    blockId,
    { ipHash, userAgent, referrer },
    Number.isInteger(index) && index >= 0 ? index : 0
  );

  if (!destinationUrl) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  return NextResponse.redirect(destinationUrl, { status: 302 });
}
