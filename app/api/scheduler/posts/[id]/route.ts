import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { updateScheduledPostSchema } from "@/lib/scheduler/validation";
import {
  getScheduledPostById,
  updateScheduledPost,
  deleteScheduledPost,
} from "@/lib/scheduler/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const post = await getScheduledPostById(context.workspaceId, id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Post não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar post";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const validated = updateScheduledPostSchema.parse(body);

    const updated = await updateScheduledPost(context.workspaceId, id, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("Error updating scheduled post:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError" && "issues" in error) {
      const issues = (error as { issues: Array<{ message: string }> }).issues;
      return NextResponse.json(
        { success: false, error: issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erro ao atualizar post";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
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
    await deleteScheduledPost(context.workspaceId, id);
    return NextResponse.json({ success: true, message: "Post excluído com sucesso" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir post";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
