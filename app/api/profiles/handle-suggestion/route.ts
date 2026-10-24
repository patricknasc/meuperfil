import { NextResponse } from "next/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { suggestHandle } from "@/lib/profiles/handle-suggestion";

export async function GET() {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const handle = await suggestHandle(context.workspaceId, context.userId);
  return NextResponse.json({ success: true, data: { handle } });
}
