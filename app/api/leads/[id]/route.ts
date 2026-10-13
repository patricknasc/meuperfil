import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { leadStatusSchema } from "@/lib/crm";
import { prisma } from "@/lib/db/client";
const updateSchema = z.object({ status: leadStatusSchema.optional(), tags: z.array(z.string().trim().min(1).max(50)).max(30).optional() }).refine((input) => input.status !== undefined || input.tags !== undefined);
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getCurrentWorkspaceContext();
  if (!context) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(context.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid contact data" }, { status: 400 });
  const { id } = await params;
  const updated = await prisma.contact.updateMany({ where: { id, workspaceId: context.workspaceId }, data: parsed.data });
  if (!updated.count) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
