import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { canManageWorkspace, getCurrentWorkspaceContext, type WorkspaceContext } from "@/lib/workspace-access";

/** Runs a store-owner API handler with auth, role check and the usual JSON error shape. */
export async function withStoreOwner(
  action: string,
  handler: (context: WorkspaceContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }
  if (!canManageWorkspace(context.role)) {
    return NextResponse.json({ success: false, error: "Permissão insuficiente no workspace" }, { status: 403 });
  }

  try {
    return await handler(context);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "Dados inválidos", field: error.issues[0]?.path.join(".") },
        { status: 400 }
      );
    }
    console.error(`Error ${action}:`, error);
    const message = error instanceof Error && error.message ? error.message : `Erro ao ${action}`;
    const status = /não encontrad/i.test(message) ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
