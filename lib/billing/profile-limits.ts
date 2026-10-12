import { prisma } from "@/lib/db/client";
import { getEffectivePlan, PLAN_LIMITS } from "@/lib/billing/plans";

export async function canCreateProfileForWorkspace(workspaceId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      plan: true,
      subscriptionStatus: true,
      _count: {
        select: { profiles: true },
      },
    },
  });

  if (!workspace) {
    return { allowed: false, currentCount: 0, limit: 0 };
  }

  const effectivePlan = getEffectivePlan(
    workspace.plan,
    workspace.subscriptionStatus
  );
  const limit = PLAN_LIMITS[effectivePlan].maxProfiles;
  const currentCount = workspace._count.profiles;

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
  };
}

export async function canAddBlockToProfile(
  profileId: string,
  workspaceId: string
): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
}> {
  const [workspace, blockCount] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        plan: true,
        subscriptionStatus: true,
      },
    }),
    prisma.profileBlock.count({
      where: { profileId },
    }),
  ]);

  if (!workspace) {
    return { allowed: false, currentCount: 0, limit: 0 };
  }

  const effectivePlan = getEffectivePlan(
    workspace.plan,
    workspace.subscriptionStatus
  );
  const limit = PLAN_LIMITS[effectivePlan].maxBlocksPerProfile;

  return {
    allowed: blockCount < limit,
    currentCount: blockCount,
    limit,
  };
}
