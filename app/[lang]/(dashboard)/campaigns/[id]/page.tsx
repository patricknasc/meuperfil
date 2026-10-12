"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getCampaignAttributionSummary,
  getCampaignConversionSnapshot,
  getCampaignInsights,
  getCampaignLinkRankings,
  getCampaignOfferSummary,
  getCampaignOutcomeSummary,
  getCampaignOverview,
} from "@/lib/campaigns/summary";

interface CampaignDetail {
  id: string;
  name: string;
  goal: string | null;
  keywords: string[];
  dmMessage: string;
  isActive: boolean;
  wholeWordMatch: boolean;
  instagramAccount: {
    username: string;
    instagramId: string;
  };
  reportUrl: string | null;
  reportShareEnabled: boolean;
  createdAt: string;
  trackedLinks: Array<{
    id: string;
    slug: string;
    destinationUrl: string;
    trackedUrl: string;
    _count: { clicks: number };
  }>;
  analytics: {
    sent: number;
    skipped: number;
    failed: number;
    clicks: number;
    ctr: number;
    topKeywords: { keyword: string; count: number }[];
  };
}

export default function CampaignDetailPage() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = ["pt", "en", "es"].includes(segments[0]) ? segments[0] : "pt";
  const prefix = `/${currentLocale}`;
  const campaignId = segments[segments.length - 1];

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/automations`);
      const data = await res.json();
      if (!data.success) return;

      const found = (data.data as CampaignDetail[]).find((item) => item.id === campaignId) ?? null;
      setCampaign(found);
    } catch (err) {
      console.error("Failed to fetch campaign detail:", err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void fetchCampaign();
  }, [fetchCampaign]);

  const overview = useMemo(() => {
    if (!campaign) return null;
    return getCampaignOverview(campaign);
  }, [campaign]);

  const conversionSnapshot = useMemo(() => {
    if (!campaign) return null;
    return getCampaignConversionSnapshot(campaign);
  }, [campaign]);

  const insights = useMemo(() => {
    if (!campaign) return null;
    return getCampaignInsights(campaign);
  }, [campaign]);

  const linkRankings = useMemo(() => {
    if (!campaign) return [];
    return getCampaignLinkRankings(campaign.trackedLinks ?? []);
  }, [campaign]);

  const offerSummary = useMemo(() => {
    if (!campaign) return null;
    return getCampaignOfferSummary(campaign);
  }, [campaign]);

  const attributionSummary = useMemo(() => {
    if (!campaign) return null;
    return getCampaignAttributionSummary(campaign);
  }, [campaign]);

  const outcomeSummary = useMemo(() => {
    if (!campaign) return null;
    return getCampaignOutcomeSummary(campaign);
  }, [campaign]);

  const keywordMomentum = useMemo(() => {
    if (!campaign) return [];
    const items = [...campaign.analytics.topKeywords].sort((left, right) => right.count - left.count);
    const maxCount = items.reduce((max, item) => Math.max(max, item.count), 0) || 1;
    return items.map((item) => ({
      ...item,
      share: Math.max((item.count / maxCount) * 100, 18),
    }));
  }, [campaign]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-2xl p-6 h-16 animate-pulse" />
        <div className="glass rounded-2xl p-6 h-72 animate-pulse" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <h2 className="text-lg font-semibold">Campaign not found</h2>
        <p className="mt-2 text-sm text-muted">This campaign may have been deleted or is no longer available.</p>
        <Link href={`${prefix}/campaigns`} className="mt-6 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted">Campaign overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{campaign.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-surface px-2 py-1 text-xs text-muted">
            @{campaign.instagramAccount.username}
          </span>
          {overview && (
            <span className="rounded-full border border-accent/20 bg-accent/5 px-2 py-1 text-xs font-medium text-accent">
              {overview.health}
            </span>
          )}
          <Link href={`${prefix}/campaigns/${campaign.id}/edit`} className="rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-foreground">
            Edit
          </Link>
          <Link href={`${prefix}/campaigns`} className="rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-foreground">
            Back
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Sent</p>
          <p className="mt-2 text-2xl font-semibold">{campaign.analytics.sent}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Clicks</p>
          <p className="mt-2 text-2xl font-semibold">{campaign.analytics.clicks}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">CTR</p>
          <p className="mt-2 text-2xl font-semibold">{campaign.analytics.ctr}%</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Keywords</p>
          <p className="mt-2 text-2xl font-semibold">{campaign.keywords.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
        <div className="glass rounded-2xl p-6 space-y-5">
          {campaign.goal && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Goal</p>
              <p className="mt-2 text-base font-medium text-foreground">{campaign.goal}</p>
            </div>
          )}

          {outcomeSummary && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted">Expected outcome</p>
              <p className="mt-2 text-sm font-medium text-foreground">{outcomeSummary.primaryOutcome}</p>
              <p className="mt-2 text-xs text-muted">{outcomeSummary.expectedOutcome}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted">
                <span>{outcomeSummary.horizon}</span>
                <span>{outcomeSummary.conversionRate}% conversion</span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Keywords</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {campaign.keywords.map((keyword) => (
                <span key={keyword} className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted">DM template</p>
            <p className="mt-2 rounded-xl border border-border bg-surface p-3 text-sm text-foreground">“{campaign.dmMessage}”</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Keyword momentum</p>
            <div className="mt-3 space-y-3">
              {keywordMomentum.length > 0 ? (
                keywordMomentum.map((keyword) => (
                  <div key={keyword.keyword}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted">
                      <span className="font-medium text-foreground">{keyword.keyword}</span>
                      <span>{keyword.count} mentions</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${keyword.share}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No keyword data yet.</p>
              )}
            </div>
          </div>

          {campaign.trackedLinks.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Tracked links</p>
              <div className="mt-3 space-y-3">
                {campaign.trackedLinks.map((link) => (
                  <div key={link.id} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-muted">{link.destinationUrl}</p>
                        <p className="mt-1 truncate text-xs text-accent">{link.trackedUrl}</p>
                      </div>
                      <a href={link.trackedUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted">
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Performance</p>
            <div className="mt-4 space-y-3 text-sm text-foreground">
              <div className="flex items-center justify-between"><span>Skipped</span><span>{campaign.analytics.skipped}</span></div>
              <div className="flex items-center justify-between"><span>Failed</span><span>{campaign.analytics.failed}</span></div>
              <div className="flex items-center justify-between"><span>Top keyword</span><span>{overview?.topKeyword ?? "No data"}</span></div>
              {conversionSnapshot && (
                <>
                  <div className="flex items-center justify-between"><span>Lead rate</span><span>{conversionSnapshot.leadRate}%</span></div>
                  <div className="flex items-center justify-between"><span>Stage</span><span>{conversionSnapshot.stage}</span></div>
                </>
              )}
            </div>
          </div>

          {insights && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-muted">Insights</p>
              <p className="mt-3 text-sm font-medium text-foreground">{insights.primary}</p>
              <div className="mt-4 rounded-xl border border-border bg-surface p-3">
                <p className="text-xs uppercase tracking-wide text-muted">Priority</p>
                <p className="mt-2 text-lg font-semibold text-accent">{insights.score}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {insights.actions.map((action) => (
                  <li key={action} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {offerSummary && offerSummary.primaryOffer && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-muted">Primary offer</p>
              <p className="mt-3 text-sm text-foreground">{offerSummary.primaryOffer}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                <span>{offerSummary.bestPathClicks} clicks</span>
                <span>{offerSummary.offerShare}% share</span>
              </div>
              {offerSummary.destinationHost && (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-accent">{offerSummary.destinationHost}</p>
              )}
            </div>
          )}

          {attributionSummary && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-muted">Attribution</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{attributionSummary.efficiencyScore}</p>
              <p className="mt-2 text-xs text-muted">ROI proxy score</p>
              <div className="mt-4 rounded-xl border border-border bg-surface p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Band</p>
                <p className="mt-2 text-sm font-medium text-accent">{attributionSummary.attributionBand}</p>
              </div>
            </div>
          )}

          {conversionSnapshot?.bestLink && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-muted">Best link</p>
              <p className="mt-3 text-sm text-foreground">{conversionSnapshot.bestLink.destinationUrl}</p>
              <p className="mt-2 text-xs text-muted">{conversionSnapshot.bestLink.clicks} clicks</p>
            </div>
          )}

          {linkRankings.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-muted">Top links</p>
              <div className="mt-4 space-y-3">
                {linkRankings.map((link, index) => (
                  <div key={link.id} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-muted">#{index + 1}</span>
                      <span className="text-xs text-accent">{link.share}%</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground truncate">{link.destinationUrl}</p>
                    <p className="mt-1 text-xs text-muted">{link.clicks} clicks</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Settings</p>
            <div className="mt-4 space-y-3 text-sm text-foreground">
              <div className="flex items-center justify-between"><span>Active</span><span>{campaign.isActive ? "Yes" : "No"}</span></div>
              <div className="flex items-center justify-between"><span>Whole word</span><span>{campaign.wholeWordMatch ? "Yes" : "No"}</span></div>
              <div className="flex items-center justify-between"><span>Report public</span><span>{campaign.reportShareEnabled ? "Yes" : "No"}</span></div>
            </div>
          </div>

          {campaign.reportUrl && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-muted">Shareable report</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    campaign.reportShareEnabled
                      ? "bg-success/10 text-success"
                      : "bg-zinc-500/10 text-zinc-400"
                  }`}
                >
                  {campaign.reportShareEnabled ? "Public" : "Hidden"}
                </span>
              </div>
              <p className="mt-3 truncate text-sm text-accent">{campaign.reportUrl}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={campaign.reportUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
                  Open report
                </a>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(campaign.reportUrl ?? "")}
                  className="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
                >
                  Copy link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
