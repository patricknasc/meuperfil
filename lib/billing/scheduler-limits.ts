import { prisma } from "@/lib/db/client";
import { getEffectivePlan, PLAN_LIMITS } from "@/lib/billing/plans";

export async function canSchedulePostForWorkspace(workspaceId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      plan: true,
      subscriptionStatus: true,
      usagePeriodStart: true,
    },
  });

  if (!workspace) {
    return { allowed: false, currentCount: 0, limit: 0 };
  }

  const effectivePlan = getEffectivePlan(
    workspace.plan,
    workspace.subscriptionStatus
  );
  const limit = PLAN_LIMITS[effectivePlan].maxScheduledPostsPerMonth;

  if (!Number.isFinite(limit)) {
    return { allowed: true, currentCount: 0, limit };
  }

  // Count posts scheduled or published in current usage period
  const periodStart = workspace.usagePeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const currentCount = await prisma.scheduledPost.count({
    where: {
      workspaceId,
      createdAt: { gte: periodStart },
      status: { not: "DRAFT" },
    },
  });

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
  };
}
