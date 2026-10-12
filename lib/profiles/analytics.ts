import { prisma } from "@/lib/db/client";

export interface ProfileAnalyticsSummary {
  totalVisits: number;
  visitsToday: number;
  visitsWeek: number;
  visitsMonth: number;
  totalClicks: number;
  clicksToday: number;
  clicksWeek: number;
  clicksMonth: number;
  ctr: number;
  dailyVisits: { date: string; count: number }[];
  dailyClicks: { date: string; count: number }[];
  clicksByBlock: { blockId: string; title: string; count: number; url?: string | null }[];
}

export function calculateCtr(clicks: number, visits: number): number {
  if (!visits || visits <= 0) return 0;
  return Number(((clicks / visits) * 100).toFixed(1));
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export async function getProfileAnalytics(profileId: string, workspaceId: string): Promise<ProfileAnalyticsSummary> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalVisits,
    visitsToday,
    visitsWeek,
    visitsMonth,
    totalClicks,
    clicksToday,
    clicksWeek,
    clicksMonth,
    recentVisits,
    recentClicks,
    blocksWithClicks,
  ] = await Promise.all([
    prisma.profileVisit.count({ where: { profileId } }),
    prisma.profileVisit.count({ where: { profileId, createdAt: { gte: todayStart } } }),
    prisma.profileVisit.count({ where: { profileId, createdAt: { gte: weekAgo } } }),
    prisma.profileVisit.count({ where: { profileId, createdAt: { gte: monthStart } } }),

    prisma.profileBlockClick.count({ where: { profileId } }),
    prisma.profileBlockClick.count({ where: { profileId, createdAt: { gte: todayStart } } }),
    prisma.profileBlockClick.count({ where: { profileId, createdAt: { gte: weekAgo } } }),
    prisma.profileBlockClick.count({ where: { profileId, createdAt: { gte: monthStart } } }),

    prisma.profileVisit.findMany({
      where: { profileId, createdAt: { gte: weekAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.profileBlockClick.findMany({
      where: { profileId, createdAt: { gte: weekAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.profileBlock.findMany({
      where: { profileId },
      select: {
        id: true,
        title: true,
        url: true,
        _count: {
          select: { clicks: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Build 7-day map for visits & clicks
  const days: string[] = [];
  const visitsMap: Record<string, number> = {};
  const clicksMap: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    const key = formatDate(d);
    days.push(key);
    visitsMap[key] = 0;
    clicksMap[key] = 0;
  }

  for (const v of recentVisits) {
    const key = formatDate(v.createdAt);
    if (visitsMap[key] !== undefined) {
      visitsMap[key]++;
    }
  }

  for (const c of recentClicks) {
    const key = formatDate(c.createdAt);
    if (clicksMap[key] !== undefined) {
      clicksMap[key]++;
    }
  }

  return {
    totalVisits,
    visitsToday,
    visitsWeek,
    visitsMonth,
    totalClicks,
    clicksToday,
    clicksWeek,
    clicksMonth,
    ctr: calculateCtr(totalClicks, totalVisits),
    dailyVisits: days.map((date) => ({ date, count: visitsMap[date] ?? 0 })),
    dailyClicks: days.map((date) => ({ date, count: clicksMap[date] ?? 0 })),
    clicksByBlock: blocksWithClicks.map((b) => ({
      blockId: b.id,
      title: b.title ?? "Sem título",
      count: b._count.clicks,
      url: b.url,
    })),
  };
}
