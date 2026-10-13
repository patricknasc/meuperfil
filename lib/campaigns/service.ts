import { prisma } from "@/lib/db/client";
import type { Prisma } from "@/app/generated/prisma/client";
import { getEffectivePlan, PLAN_LIMITS } from "@/lib/billing/plans";

export class CampaignLimitError extends Error {}

export async function createCampaign(data: Prisma.AutomationUncheckedCreateInput) {
  return prisma.$transaction(async (tx) => {
    // Both manual and scheduled campaigns serialize quota checks on this row.
    await tx.$queryRaw`SELECT "id" FROM "Workspace" WHERE "id" = ${data.workspaceId} FOR UPDATE`;
    const workspace = await tx.workspace.findUniqueOrThrow({
      where: { id: data.workspaceId },
    });
    const plan = getEffectivePlan(workspace.plan, workspace.subscriptionStatus);
    const limit = PLAN_LIMITS[plan].maxAutomations;
    const count = await tx.automation.count({ where: { workspaceId: data.workspaceId } });
    if (count >= limit) {
      throw new CampaignLimitError(`Limite do plano ${plan} atingido (${limit} campanhas).`);
    }
    const account = await tx.instagramAccount.findFirst({
      where: { id: data.instagramAccountId, workspaceId: data.workspaceId },
      select: { id: true },
    });
    if (!account) throw new Error("Conta do Instagram não pertence ao workspace.");
    return tx.automation.create({ data, include: { trackedLinks: true } });
  });
}
