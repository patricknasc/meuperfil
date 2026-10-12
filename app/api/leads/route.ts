import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { leadStatusSchema, listWorkspaceLeads } from "@/lib/crm";

const leadFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(), status: leadStatusSchema.optional(),
  campaignId: z.string().min(1).optional(), page: z.coerce.number().int().min(1).max(10000).default(1),
});
export async function GET(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const parsed = leadFiltersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid filters" }, { status: 400 });
  const data = await listWorkspaceLeads(context.workspaceId, parsed.data);
  return NextResponse.json({ success: true, data });
}
