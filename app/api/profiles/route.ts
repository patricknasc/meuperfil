import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { createProfileSchema } from "@/lib/profiles/validation";
import { getProfilesForWorkspace, createProfile } from "@/lib/profiles/service";

export async function GET() {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const profiles = await getProfilesForWorkspace(context.workspaceId);
    return NextResponse.json({ success: true, data: profiles });
  } catch (error: any) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao buscar perfis" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validated = createProfileSchema.parse(body);

    const profile = await createProfile(context.workspaceId, validated);
    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating profile:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao criar perfil" },
      { status: 400 }
    );
  }
}
