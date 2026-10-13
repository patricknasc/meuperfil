import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { triggerInstantPublish } from "@/lib/scheduler/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  if (!canManageWorkspace(context.role)) {
    return NextResponse.json(
      { success: false, error: "Permissão insuficiente no workspace" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const res = await triggerInstantPublish(context.workspaceId, id);
    return NextResponse.json(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao disparar publicação";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
