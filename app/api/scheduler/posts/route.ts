import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { createScheduledPostSchema, scheduledPostFiltersSchema } from "@/lib/scheduler/validation";
import { listScheduledPosts, createScheduledPost, SchedulerError } from "@/lib/scheduler/service";


export async function GET(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const filters = scheduledPostFiltersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filters.success) return NextResponse.json({ success: false, error: "Filtros inválidos" }, { status: 400 });

  try {
    const posts = await listScheduledPosts(context.workspaceId, filters.data);
    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    const message = "Não foi possível carregar as publicações.";
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
    const message = error instanceof SchedulerError ? error.message : "Não foi possível salvar a publicação.";
    return NextResponse.json({ success: false, error: message }, { status: error instanceof SchedulerError ? 400 : 500 });
  }
}
