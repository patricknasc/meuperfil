import { prisma } from "@/lib/db/client";
import { getSocialPlatform } from "@/lib/profiles/social-platforms";
import { classifySource, parseUserAgent } from "@/lib/tracking/visitor";

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface VisitBreakdowns {
  /** Window the breakdowns cover, in days. */
  days: number;
  sources: BreakdownItem[];
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  countries: BreakdownItem[];
  cities: BreakdownItem[];
  campaigns: BreakdownItem[];
}

const BREAKDOWN_DAYS = 30;

function topCounts(values: Array<string | null>, limit = 8): BreakdownItem[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

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
  clicksByBlock: {
    blockId: string;
    title: string;
    count: number;
    url?: string | null;
    /** Per-channel clicks for social link blocks. */
    channels?: BreakdownItem[];
  }[];
  breakdowns: VisitBreakdowns;
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
    socialClicks,
    breakdownVisits,
  ] = await Promise.all([
    prisma.profileVisit.count({ where: { profileId, workspaceId } }),
    prisma.profileVisit.count({ where: { profileId, workspaceId, createdAt: { gte: todayStart } } }),
    prisma.profileVisit.count({ where: { profileId, workspaceId, createdAt: { gte: weekAgo } } }),
    prisma.profileVisit.count({ where: { profileId, workspaceId, createdAt: { gte: monthStart } } }),

    prisma.profileBlockClick.count({ where: { profileId, workspaceId } }),
    prisma.profileBlockClick.count({ where: { profileId, workspaceId, createdAt: { gte: todayStart } } }),
    prisma.profileBlockClick.count({ where: { profileId, workspaceId, createdAt: { gte: weekAgo } } }),
    prisma.profileBlockClick.count({ where: { profileId, workspaceId, createdAt: { gte: monthStart } } }),

    prisma.profileVisit.findMany({
      where: { profileId, workspaceId, createdAt: { gte: weekAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.profileBlockClick.findMany({
      where: { profileId, workspaceId, createdAt: { gte: weekAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.profileBlock.findMany({
      // Dividers are not clickable, so they have no click count to show.
      where: { profileId, profile: { workspaceId }, type: { not: "TEXT_DIVIDER" } },
      select: {
        id: true,
        title: true,
        url: true,
        type: true,
        config: true,
        _count: {
          select: { clicks: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),

    prisma.profileBlockClick.groupBy({
      by: ["blockId", "destinationUrl"],
      where: { profileId, workspaceId, block: { type: "SOCIAL_LINKS" } },
      _count: { _all: true },
    }),

    prisma.profileVisit.findMany({
      where: { profileId, workspaceId, createdAt: { gte: new Date(now.getTime() - BREAKDOWN_DAYS * 86_400_000) } },
      select: {
        userAgent: true,
        referrer: true,
        country: true,
        region: true,
        city: true,
        utmSource: true,
        utmCampaign: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20_000,
    }),
  ]);

  const visitors = breakdownVisits.map((v) => ({ ...v, ua: parseUserAgent(v.userAgent) }));
  const humans = visitors.filter((v) => v.ua.device !== "bot");
  const deviceLabel = { mobile: "Celular", tablet: "Tablet", desktop: "Computador", bot: "Robô" } as const;
  const breakdowns: VisitBreakdowns = {
    days: BREAKDOWN_DAYS,
    sources: topCounts(humans.map((v) => classifySource({ utmSource: v.utmSource, referrer: v.referrer, userAgent: v.userAgent }))),
    devices: topCounts(visitors.map((v) => deviceLabel[v.ua.device])),
    browsers: topCounts(humans.map((v) => v.ua.browser)),
    countries: topCounts(humans.map((v) => v.country)),
    cities: topCounts(humans.map((v) => (v.city ? [v.city, v.region].filter(Boolean).join(" - ") : null))),
    campaigns: topCounts(humans.map((v) => (v.utmCampaign || v.utmSource ? [v.utmCampaign, v.utmSource].filter(Boolean).join(" · ") : null))),
  };

  function channelsFor(blockId: string, config: unknown): BreakdownItem[] {
    const links = ((config as { links?: Array<{ platform: string; url: string }> } | null)?.links ?? []);
    const labelFor = (url: string) => {
      const link = links.find((l) => l.url === url);
      return link ? getSocialPlatform(link.platform).label : url;
    };
    return socialClicks
      .filter((c) => c.blockId === blockId)
      .map((c) => ({ label: labelFor(c.destinationUrl), count: c._count._all }))
      .sort((a, b) => b.count - a.count);
  }

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
      url: b.type === "SOCIAL_LINKS" ? null : b.url,
      channels: b.type === "SOCIAL_LINKS" ? channelsFor(b.id, b.config) : undefined,
    })),
    breakdowns,
  };
}
