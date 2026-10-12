import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { updateBlockSchema } from "@/lib/profiles/validation";
import { updateBlock, deleteBlock } from "@/lib/profiles/service";
import { ZodError } from "zod";

interface RouteProps {
  params: Promise<{ id: string; blockId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const { blockId } = await params;
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

  try {
    const body = await request.json();
    const validated = updateBlockSchema.parse(body);

    const updated = await updateBlock(blockId, context.workspaceId, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating block:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || "Erro ao atualizar bloco" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  const { blockId } = await params;
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

  try {
    await deleteBlock(blockId, context.workspaceId);
    return NextResponse.json({ success: true, message: "Bloco excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting block:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || "Erro ao excluir bloco" },
      { status: 400 }
    );
  }
}
