import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { createBlockSchema, reorderBlocksSchema } from "@/lib/profiles/validation";
import { createBlock, reorderBlocks } from "@/lib/profiles/service";
import { ZodError } from "zod";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { id: profileId } = await params;
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
    const validated = createBlockSchema.parse(body);

    const block = await createBlock(profileId, context.workspaceId, validated);
    return NextResponse.json({ success: true, data: block }, { status: 201 });
  } catch (error) {
    console.error("Error creating block:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || "Erro ao criar bloco" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const { id: profileId } = await params;
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
    const validated = reorderBlocksSchema.parse(body);

    await reorderBlocks(profileId, context.workspaceId, validated.blockIds);
    return NextResponse.json({ success: true, message: "Blocos reordenados com sucesso" });
  } catch (error) {
    console.error("Error reordering blocks:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || "Erro ao reordenar blocos" },
      { status: 400 }
    );
  }
}
