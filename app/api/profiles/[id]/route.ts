import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { updateProfileSchema } from "@/lib/profiles/validation";
import { getProfileById, updateProfile, deleteProfile } from "@/lib/profiles/service";
import { getProfileAnalytics } from "@/lib/profiles/analytics";
import { ZodError } from "zod";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const profile = await getProfileById(id, context.workspaceId);
    if (!profile) {
      return NextResponse.json({ success: false, error: "Perfil não encontrado" }, { status: 404 });
    }

    const analytics = await getProfileAnalytics(id, context.workspaceId);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        analytics,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
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
    const validated = updateProfileSchema.parse(body);

    const updated = await updateProfile(id, context.workspaceId, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || "Erro ao atualizar perfil" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
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
    await deleteProfile(id, context.workspaceId);
    return NextResponse.json({ success: true, message: "Perfil excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || "Erro ao excluir perfil" },
      { status: 400 }
    );
  }
}
