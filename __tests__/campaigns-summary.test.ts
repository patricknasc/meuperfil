import { describe, expect, it } from "vitest";
import {
  getCampaignAttributionSummary,
  getCampaignConversionSnapshot,
  getCampaignExecutiveSummary,
  getCampaignInsights,
  getCampaignLinkRankings,
  getCampaignOfferSummary,
  getCampaignOutcomeSummary,
  getCampaignOverview,
  getCampaignOverviewStats,
  getCampaignPerformanceLeaderboard,
} from "@/lib/campaigns/summary";

describe("campaign summary helpers", () => {
  it("summarizes the healthiest active campaign state", () => {
    const summary = getCampaignOverview({
      isActive: true,
      analytics: {
        sent: 120,
        skipped: 8,
        failed: 3,
        clicks: 26,
        ctr: 21.7,
        topKeywords: [
          { keyword: "LINK", count: 18 },
          { keyword: "BEM", count: 12 },
        ],
      },
    });

    expect(summary.health).toBe("Working");
    expect(summary.topKeyword).toBe("LINK (18)");
    expect(summary.ctr).toBe(21.7);
  });

  it("aggregates workspace-level stats across campaigns", () => {
    const stats = getCampaignOverviewStats([
      {
        isActive: true,
        analytics: { sent: 50, skipped: 4, failed: 2, clicks: 12, ctr: 24 },
      },
      {
        isActive: false,
        analytics: { sent: 30, skipped: 3, failed: 1, clicks: 6, ctr: 20 },
      },
      {
        isActive: true,
        analytics: { sent: 0, skipped: 0, failed: 0, clicks: 0, ctr: 0 },
      },
    ]);

    expect(stats.active).toBe(2);
    expect(stats.totalSent).toBe(80);
    expect(stats.totalClicks).toBe(18);
    expect(stats.avgCtr).toBe(14.67);
  });

  it("builds a conversion snapshot for the strongest campaign flow", () => {
    const snapshot = getCampaignConversionSnapshot({
      isActive: true,
      analytics: {
        sent: 240,
        clicks: 62,
        ctr: 25.8,
        topKeywords: [
          { keyword: "LINK", count: 32 },
          { keyword: "PREÇO", count: 20 },
        ],
      },
      trackedLinks: [
        {
          id: "link-1",
          destinationUrl: "https://example.com/offer",
          clicks: 34,
          slug: "offer",
          trackedUrl: "https://meuperfil.me/go/offer",
        },
        {
          id: "link-2",
          destinationUrl: "https://example.com/demo",
          clicks: 28,
          slug: "demo",
          trackedUrl: "https://meuperfil.me/go/demo",
        },
      ],
    });

    expect(snapshot.totalClicks).toBe(62);
    expect(snapshot.leadRate).toBe(25.83);
    expect(snapshot.bestLink).not.toBeNull();
    expect(snapshot.bestLink?.destinationUrl).toBe("https://example.com/offer");
    expect(snapshot.topKeyword).toBe("LINK");
    expect(snapshot.stage).toBe("Strong");
  });

  it("identifies the primary offer and its attribution share", () => {
    const summary = getCampaignOfferSummary({
      isActive: true,
      analytics: {
        sent: 120,
        clicks: 42,
        ctr: 35,
      },
      trackedLinks: [
        {
          id: "link-1",
          destinationUrl: "https://example.com/offer",
          clicks: 30,
          slug: "offer",
          trackedUrl: "https://meuperfil.me/go/offer",
        },
        {
          id: "link-2",
          destinationUrl: "https://example.com/demo",
          clicks: 12,
          slug: "demo",
          trackedUrl: "https://meuperfil.me/go/demo",
        },
      ],
    });

    expect(summary.primaryOffer).toBe("https://example.com/offer");
    expect(summary.bestPathClicks).toBe(30);
    expect(summary.offerShare).toBe(71.43);
    expect(summary.destinationHost).toBe("example.com");
  });

  it("calculates a simple ROI proxy and attribution quality score", () => {
    const summary = getCampaignAttributionSummary({
      isActive: true,
      analytics: {
        sent: 140,
        clicks: 35,
        ctr: 25,
      },
      trackedLinks: [
        {
          id: "link-1",
          destinationUrl: "https://example.com/high-intent",
          clicks: 21,
          slug: "high-intent",
          trackedUrl: "https://meuperfil.me/go/high-intent",
        },
        {
          id: "link-2",
          destinationUrl: "https://example.com/backup",
          clicks: 14,
          slug: "backup",
          trackedUrl: "https://meuperfil.me/go/backup",
        },
      ],
    });

    expect(summary.efficiencyScore).toBe(60);
    expect(summary.primaryOffer).toBe("https://example.com/high-intent");
    expect(summary.attributionBand).toBe("Strong");
  });

  it("creates a clear executive recommendation with the next best move", () => {
    const summary = getCampaignExecutiveSummary({
      isActive: true,
      analytics: {
        sent: 240,
        clicks: 72,
        ctr: 30,
        topKeywords: [{ keyword: "LINK", count: 38 }],
      },
    });

    expect(summary.priority).toBe("Scale");
    expect(summary.recommendation).toContain("scale");
    expect(summary.nextAction).toContain("LINK");
  });

  it("translates the campaign objective into a clear business outcome", () => {
    const summary = getCampaignOutcomeSummary({
      goal: "Lead magnet delivery",
      isActive: true,
      analytics: {
        sent: 240,
        clicks: 72,
        ctr: 30,
      },
    });

    expect(summary.primaryOutcome).toContain("lead");
    expect(summary.expectedOutcome).toContain("lead");
    expect(summary.horizon).toBe("High intent");
  });

  it("ranks tracked links by click volume to identify the strongest CTA", () => {
    const rankings = getCampaignLinkRankings([
      {
        id: "link-1",
        destinationUrl: "https://example.com/offer",
        clicks: 18,
        slug: "offer",
        trackedUrl: "https://meuperfil.me/go/offer",
      },
      {
        id: "link-2",
        destinationUrl: "https://example.com/demo",
        clicks: 42,
        slug: "demo",
        trackedUrl: "https://meuperfil.me/go/demo",
      },
      {
        id: "link-3",
        destinationUrl: "https://example.com/price",
        clicks: 10,
        slug: "price",
        trackedUrl: "https://meuperfil.me/go/price",
      },
    ]);

    expect(rankings[0].destinationUrl).toBe("https://example.com/demo");
    expect(rankings[0].share).toBe(60);
    expect(rankings[1].destinationUrl).toBe("https://example.com/offer");
  });

  it("orders active campaigns by conversion efficiency for executive review", () => {
    const leaderboard = getCampaignPerformanceLeaderboard([
      {
        id: "camp-1",
        name: "Launch",
        isActive: true,
        analytics: { sent: 120, clicks: 30, ctr: 25 },
      },
      {
        id: "camp-2",
        name: "Waitlist",
        isActive: true,
        analytics: { sent: 90, clicks: 36, ctr: 40 },
      },
      {
        id: "camp-3",
        name: "Paused",
        isActive: false,
        analytics: { sent: 200, clicks: 10, ctr: 5 },
      },
    ]);

    expect(leaderboard[0].name).toBe("Waitlist");
    expect(leaderboard[1].name).toBe("Launch");
    expect(leaderboard[2].name).toBe("Paused");
  });

  it("produces a clear next-action recommendation for the campaign", () => {
    const insights = getCampaignInsights({
      isActive: true,
      analytics: {
        sent: 180,
        clicks: 18,
        ctr: 10,
        topKeywords: [{ keyword: "LINK", count: 24 }],
      },
    });

    expect(insights.score).toBe("Medium");
    expect(insights.primary).toContain("test");
    expect(insights.actions[0]).toContain("LINK");
  });
});
