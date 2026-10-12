import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { createScheduledPostSchema } from "@/lib/scheduler/validation";
import { listScheduledPosts, createScheduledPost } from "@/lib/scheduler/service";
import type { PostStatus } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as PostStatus) || undefined;
  const instagramAccountId = searchParams.get("instagramAccountId") || undefined;
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  try {
    const posts = await listScheduledPosts(context.workspaceId, {
      status,
      instagramAccountId,
      startDate,
      endDate,
    });
    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar posts agendados";
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
    const validated = createScheduledPostSchema.parse(body);

    const post = await createScheduledPost(context.workspaceId, validated);
    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating scheduled post:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError" && "issues" in error) {
      const issues = (error as { issues: Array<{ message: string }> }).issues;
      return NextResponse.json(
        { success: false, error: issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erro ao criar post agendado";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
