import { campaignTranslator } from "@/lib/i18n/campaigns";

export interface CampaignLinkSummary {
  id: string;
  destinationUrl: string;
  clicks?: number;
  slug: string;
  trackedUrl?: string;
  _count?: {
    clicks?: number;
  };
}

export interface CampaignSummaryInput {
  goal?: string | null;
  isActive: boolean;
  analytics: {
    sent?: number;
    skipped?: number;
    failed?: number;
    clicks?: number;
    ctr?: number;
    leads?: number;
    convertedLeads?: number;
    topKeywords?: Array<{ keyword: string; count: number }>;
  };
  trackedLinks?: CampaignLinkSummary[];
}

function getLinkClickCount(link: { clicks?: number; _count?: { clicks?: number } }) {
  return link.clicks ?? link._count?.clicks ?? 0;
}

export function getCampaignOverview(campaign: CampaignSummaryInput) {
  const sent = campaign.analytics.sent ?? 0;
  const clicks = campaign.analytics.clicks ?? 0;
  const ctr = campaign.analytics.ctr ?? 0;
  const topKeyword =
    campaign.analytics.topKeywords && campaign.analytics.topKeywords.length > 0
      ? `${campaign.analytics.topKeywords[0].keyword} (${campaign.analytics.topKeywords[0].count})`
      : "No data";

  const health = !campaign.isActive
    ? "Paused"
    : sent === 0
      ? "Waiting"
      : clicks === 0
        ? "Monitoring"
        : ctr >= 20
          ? "Working"
          : "Testing";

  return {
    health,
    topKeyword,
    ctr,
    sent,
    clicks,
  };
}

export function getCampaignOverviewStats(campaigns: CampaignSummaryInput[]) {
  const active = campaigns.filter((campaign) => campaign.isActive).length;

  const totalSent = campaigns.reduce((sum, campaign) => sum + (campaign.analytics.sent ?? 0), 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.analytics.clicks ?? 0), 0);
  const avgCtr = campaigns.length
    ? campaigns.reduce((sum, campaign) => sum + (campaign.analytics.ctr ?? 0), 0) / campaigns.length
    : 0;

  return {
    active,
    totalSent,
    totalClicks,
    avgCtr: Number(avgCtr.toFixed(2)),
  };
}

export function getCampaignConversionSnapshot(campaign: CampaignSummaryInput) {
  const sent = campaign.analytics.sent ?? 0;
  const clicks = campaign.analytics.clicks ?? 0;
  const topKeyword =
    campaign.analytics.topKeywords && campaign.analytics.topKeywords.length > 0
      ? campaign.analytics.topKeywords[0].keyword
      : "No data";

  const links = (campaign.trackedLinks ?? []).map((link) => ({
    ...link,
    clicks: getLinkClickCount(link),
  }));

  const bestLink =
    links.length > 0
      ? links.reduce((best, next) => (next.clicks > best.clicks ? next : best), links[0])
      : null;

  const clickRate = sent > 0 ? Number(((clicks / sent) * 100).toFixed(2)) : 0;
  const stage = !campaign.isActive
    ? "Paused"
    : sent === 0
      ? "Waiting"
      : clickRate >= 25
        ? "Strong"
        : clickRate >= 10
          ? "Growing"
          : "Early";

  return {
    totalClicks: clicks,
    clickRate,
    bestLink,
    topKeyword,
    stage,
  };
}

export function getCampaignOfferSummary(campaign: CampaignSummaryInput) {
  const links = (campaign.trackedLinks ?? []).map((link) => ({
    ...link,
    clicks: getLinkClickCount(link),
  }));

  if (links.length === 0) {
    return {
      primaryOffer: null,
      bestPathClicks: 0,
      offerShare: 0,
      destinationHost: null,
    };
  }

  const bestLink = links.reduce((best, next) => (next.clicks > best.clicks ? next : best), links[0]);
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const offerShare = totalClicks > 0 ? Number(((bestLink.clicks / totalClicks) * 100).toFixed(2)) : 0;

  let destinationHost: string | null = null;
  try {
    destinationHost = new URL(bestLink.destinationUrl).hostname.replace(/^www\./, "");
  } catch {
    destinationHost = bestLink.destinationUrl;
  }

  return {
    primaryOffer: bestLink.destinationUrl,
    bestPathClicks: bestLink.clicks,
    offerShare,
    destinationHost,
  };
}

export function getCampaignAttributionSummary(campaign: CampaignSummaryInput) {
  const clicks = campaign.analytics.clicks ?? 0;
  const sent = campaign.analytics.sent ?? 0;
  const ctr = campaign.analytics.ctr ?? 0;
  const offerSummary = getCampaignOfferSummary(campaign);

  const efficiencyScore = sent > 0
    ? Math.min(100, Number((((clicks / sent) * 100 + ctr) * 1.2).toFixed(2)))
    : 0;
  const primaryOffer = offerSummary.primaryOffer ?? "No tracked link";
  const attributionBand = efficiencyScore >= 60 ? "Strong" : efficiencyScore >= 35 ? "Growing" : "Early";

  return {
    efficiencyScore: Number(efficiencyScore.toFixed(2)),
    primaryOffer,
    attributionBand,
    bestPathClicks: offerSummary.bestPathClicks,
    offerShare: offerSummary.offerShare,
  };
}

export function getCampaignLinkRankings(links: CampaignLinkSummary[]) {
  const totalClicks = links.reduce((sum, link) => sum + getLinkClickCount(link), 0);

  return links
    .map((link) => {
      const clicks = getLinkClickCount(link);
      return {
        ...link,
        clicks,
        share: totalClicks > 0 ? Number(((clicks / totalClicks) * 100).toFixed(2)) : 0,
      };
    })
    .sort((left, right) => right.clicks - left.clicks);
}

export function getCampaignPerformanceLeaderboard(
  campaigns: Array<{
    id: string;
    name: string;
    isActive: boolean;
    analytics: {
      sent?: number;
      clicks?: number;
      ctr?: number;
    };
  }>
) {
  return [...campaigns]
    .map((campaign) => ({
      ...campaign,
      sent: campaign.analytics.sent ?? 0,
      clicks: campaign.analytics.clicks ?? 0,
      ctr: campaign.analytics.ctr ?? 0,
      score: (campaign.analytics.ctr ?? 0) * (campaign.isActive ? 1.2 : 0.5),
    }))
    .sort((left, right) => {
      if (right.isActive !== left.isActive) {
        return Number(right.isActive) - Number(left.isActive);
      }
      return right.score - left.score;
    })
    .map(({ id, name, isActive, sent, clicks, ctr, score }) => ({
      id,
      name,
      isActive,
      sent,
      clicks,
      ctr,
      score,
    }));
}

export function getCampaignExecutiveSummary(campaign: CampaignSummaryInput, locale = "en") {
  const t = campaignTranslator(locale);
  const ctr = campaign.analytics.ctr ?? 0;
  const sent = campaign.analytics.sent ?? 0;
  const clicks = campaign.analytics.clicks ?? 0;
  const topKeyword =
    campaign.analytics.topKeywords && campaign.analytics.topKeywords.length > 0
      ? campaign.analytics.topKeywords[0].keyword
      : "LINK";

  const priority = !campaign.isActive
    ? "Paused"
    : sent === 0
      ? "Waiting"
      : ctr >= 25
        ? "Scale"
        : ctr >= 12
          ? "Optimize"
          : "Fix";

  const recommendation =
    priority === "Scale"
      ? t("This campaign is ready to scale. Increase volume on the winning message and keep the current offer stable.")
      : priority === "Optimize"
        ? t("This campaign is performing, but still needs a sharper message. Optimize the CTA and offer around LINK before scaling.")
        : priority === "Fix"
          ? t("This campaign needs a stronger offer and a clearer trigger before it can scale effectively.")
          : t("This campaign is paused or hasn't started sending enough volume to make an executive call yet.");

  const nextAction =
    priority === "Scale"
      ? t("Scale the strongest creative around {keyword} and increase delivery on the current winning flow.", { keyword: topKeyword, ctr })
      : priority === "Optimize"
        ? t("Optimize the CTA and offer around {keyword} to improve conversion quality before a broader push.", { keyword: topKeyword, ctr })
        : t("Fix the offer and tighten the response trigger around {keyword} before expanding spend or volume.", { keyword: topKeyword, ctr });

  return {
    priority,
    recommendation,
    nextAction,
    ctr,
    sent,
    clicks,
  };
}

export function getCampaignOutcomeSummary(campaign: CampaignSummaryInput, locale = "en") {
  const t = campaignTranslator(locale);
  const goal = campaign.goal ?? t("Campaign objective");
  const goalText = goal.toLowerCase();
  const ctr = campaign.analytics.ctr ?? 0;

  const primaryOutcome = goalText.includes("waitlist")
    ? t("waitlist growth")
    : goalText.includes("lead") || goalText.includes("form") || goalText.includes("magnet")
      ? t("lead capture")
      : goalText.includes("sale") || goalText.includes("product") || goalText.includes("price")
        ? t("sales or booking intent")
        : t("audience engagement");

  const expectedOutcome = goalText.includes("waitlist")
    ? t("Grow a qualified waitlist and turn attention into registrations.")
    : goalText.includes("lead") || goalText.includes("form") || goalText.includes("magnet")
      ? t("Capture high-intent leads and move them into an email or sales follow-up flow.")
      : goalText.includes("sale") || goalText.includes("product") || goalText.includes("price")
        ? t("Turn interest into product demand, purchases, or booked conversations.")
        : t("Build momentum, intent, and repeat engagement from the top keyword.")

  const leads = campaign.analytics.leads ?? 0;
  const convertedLeads = campaign.analytics.convertedLeads ?? 0;
  const conversionRate = leads > 0 ? Number(((convertedLeads / leads) * 100).toFixed(2)) : 0;
  const horizon = ctr >= 25 ? t("High intent") : ctr >= 12 ? t("Growing intent") : t("Early stage");

  return {
    goal,
    primaryOutcome,
    expectedOutcome,
    conversionRate,
    horizon,
  };
}

export function getCampaignInsights(campaign: CampaignSummaryInput, locale = "en") {
  const t = campaignTranslator(locale);
  const ctr = campaign.analytics.ctr ?? 0;
  const sent = campaign.analytics.sent ?? 0;
  const clicks = campaign.analytics.clicks ?? 0;
  const topKeyword =
    campaign.analytics.topKeywords && campaign.analytics.topKeywords.length > 0
      ? campaign.analytics.topKeywords[0].keyword
      : "LINK";

  const score = !campaign.isActive
    ? "Paused"
    : sent === 0
      ? "Waiting"
      : ctr >= 20
        ? "High"
        : ctr >= 10
          ? "Medium"
          : "Low";

  const primary =
    score === "High"
      ? t("This campaign is converting well. Keep the offer and tighten creative testing only if scale matters.")
      : score === "Medium"
        ? t("This campaign is active but still underperforming. We should test a sharper CTA and a stronger headline around LINK.")
        : score === "Low"
          ? t("This campaign needs a tighter offer and a stronger response trigger before scaling.")
          : t("This campaign is paused or has not started sending messages yet.");

  const actions = [
    t("Test a stronger CTA around {keyword} to lift the current {ctr}% CTR.", { keyword: topKeyword, ctr }),
    clicks > 0
      ? t("Keep the best-performing conversion path and trim weak variants.")
      : t("Write a more specific offer in the DM and shorten the call to action."),
    sent > 0 ? t("Review the top keyword and push the strongest message to more posts.") : t("Start with one keyword and one CTA before scaling."),
  ];

  return {
    score,
    primary,
    actions,
  };
}
