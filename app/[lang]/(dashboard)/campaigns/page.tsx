"use client";

import { campaignTranslator } from "@/lib/i18n/campaigns";

/**
 * Campaigns List Page
 *
 * Shows all campaigns as cards with toggle and delete.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import {
  getCampaignAttributionSummary,
  getCampaignExecutiveSummary,
  getCampaignInsights,
  getCampaignOverview,
  getCampaignOverviewStats,
  getCampaignPerformanceLeaderboard,
} from "@/lib/campaigns/summary";

interface Campaign {
  id: string;
  name: string;
  goal: string | null;
  postId: string;
  postUrl: string | null;
  keywords: string[];
  dmMessage: string;
  isActive: boolean;
  wholeWordMatch: boolean;
  instagramAccount: {
    username: string;
    instagramId: string;
  };
  reportShareSlug: string | null;
  reportShareEnabled: boolean;
  reportUrl: string | null;
  createdAt: string;
  _count: { dmLogs: number };
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

export default function CampaignsPage() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = ["pt", "en", "es"].includes(segments[0]) ? segments[0] : "pt";
  const prefix = `/${currentLocale}`;
  const t = campaignTranslator(currentLocale);

  const [automations, setAutomations] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "attention">("all");
  const [loading, setLoading] = useState(true);

  const fetchAutomations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedAccountId !== "all") {
        params.set("instagramAccountId", selectedAccountId);
      }
      const res = await fetch(`/api/automations${params.size ? `?${params}` : ""}`);
      const data = await res.json();
      if (data.success) setAutomations(data.data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setAccounts(payload.data.instagramAccounts ?? []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAutomations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAutomations]);

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await fetch(`/api/automations?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a))
      );
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  }

  async function toggleReport(id: string, reportShareEnabled: boolean) {
    try {
      await fetch(`/api/automations?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportShareEnabled: !reportShareEnabled }),
      });
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, reportShareEnabled: !reportShareEnabled }
            : a
        )
      );
    } catch (err) {
      console.error("Failed to toggle report:", err);
    }
  }

  async function deleteAutomation(id: string) {
    if (!confirm(t("Delete this campaign? This cannot be undone."))) return;
    try {
      await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  const overviewStats = getCampaignOverviewStats(automations);
  const portfolioRoi = automations.length
    ? Math.round(
        automations.reduce((sum, campaign) => {
          const attribution = getCampaignAttributionSummary(campaign);
          return sum + attribution.efficiencyScore;
        }, 0) / automations.length
      )
    : 0;
  const portfolioBands = automations.reduce(
    (summary, campaign) => {
      const band = getCampaignAttributionSummary(campaign).attributionBand;
      if (band === "Strong") summary.strong += 1;
      else if (band === "Growing") summary.growing += 1;
      else summary.early += 1;
      return summary;
    },
    { strong: 0, growing: 0, early: 0 }
  );
  const leaderboard = getCampaignPerformanceLeaderboard(
    automations.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      isActive: campaign.isActive,
      analytics: {
        sent: campaign.analytics.sent,
        clicks: campaign.analytics.clicks,
        ctr: campaign.analytics.ctr,
      },
    }))
  );

  const filteredAutomations = automations.filter((auto) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return auto.isActive;
    if (statusFilter === "paused") return !auto.isActive;
    return getCampaignInsights(auto, currentLocale).score === "Medium" || getCampaignInsights(auto, currentLocale).score === "Low";
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">{t("Active")}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{overviewStats.active}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">{t("Sent")}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{overviewStats.totalSent}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">{t("Clicks")}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{overviewStats.totalClicks}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">{t("Avg CTR")}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{overviewStats.avgCtr}%</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">ROI</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{portfolioRoi}</p>
        </div>
      </div>

      {automations.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{t("Executive view")}</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{t("Portfolio health")}</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: t("Strong"), value: portfolioBands.strong, accent: "text-success" },
              { label: t("Growing"), value: portfolioBands.growing, accent: "text-warning" },
              { label: t("Early"), value: portfolioBands.early, accent: "text-muted" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted">{item.label}</p>
                <p className={`mt-3 text-2xl font-semibold ${item.accent}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{t("Leaderboard")}</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{t("Campaign performance")}</h2>
            </div>
          </div>

          <div className="space-y-3">
            {leaderboard.map((campaign, index) => (
              <div key={campaign.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{campaign.name}</p>
                    <p className="text-xs text-muted">{campaign.isActive ? t("Active") : t("Paused")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>{campaign.sent} {t("sent")}</span>
                  <span>{campaign.clicks} {t("clicks")}</span>
                  <span className="font-medium text-accent">{campaign.ctr}% CTR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">
            {t(automations.length === 1 ? "{shown} of {total} campaign" : "{shown} of {total} campaigns", { shown: filteredAutomations.length, total: automations.length })}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {accounts.length > 1 && (
            <AccountSelect
              accounts={accounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          )}
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-1">
            {[
              { key: "all", label: t("All") },
              { key: "active", label: t("Active") },
              { key: "paused", label: t("Paused") },
              { key: "attention", label: t("Needs attention") },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key as typeof statusFilter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === filter.key
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <Link
            href={`${prefix}/campaigns/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("New Campaign")}
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {filteredAutomations.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("No campaigns yet")}</h3>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            {t("Create your first comment-to-DM campaign to turn a post or reel into a measurable conversation flow.")}
          </p>
          <Link
            href={`${prefix}/campaigns/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
          >
            {t("Create Campaign")}
          </Link>
        </div>
      )}

      {/* Campaign cards */}
      <div className="space-y-4 stagger">
        {filteredAutomations.map((auto) => {
          const campaignInsight = getCampaignInsights(auto, currentLocale);
          const attribution = getCampaignAttributionSummary(auto);
          const executiveSummary = getCampaignExecutiveSummary(auto, currentLocale);

          return (
          <div key={auto.id} className="glass rounded-2xl p-6 animate-fade-in hover:border-border-hover transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-base font-semibold truncate">{auto.name}</h3>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                    @{auto.instagramAccount.username}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      auto.isActive
                        ? "bg-success/10 text-success"
                        : "bg-zinc-500/10 text-zinc-400"
                    }`}
                  >
                    {auto.isActive ? t("Active") : t("Paused")}
                  </span>
                </div>

                {auto.goal && (
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">
                    {t(auto.goal)}
                  </p>
                )}

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted">
                    {t(getCampaignOverview(auto).health)}
                  </span>
                  <span className="rounded-full border border-accent/20 bg-accent/5 px-2 py-1 text-[11px] font-medium text-accent">
                    ROI {attribution.efficiencyScore}
                  </span>
                  <span className="rounded-full border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted">
                    {t(attribution.attributionBand)}
                  </span>
                  {getCampaignOverview(auto).topKeyword !== "No data" && (
                    <span className="rounded-full border border-accent/20 bg-accent/5 px-2 py-1 text-[11px] font-medium text-accent">
                      {t("Top keyword")}: {getCampaignOverview(auto).topKeyword}
                    </span>
                  )}
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {auto.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-medium border border-accent/10"
                    >
                      {kw}
                    </span>
                  ))}
                </div>

                {/* DM preview */}
                <p className="text-sm text-muted truncate">&ldquo;{auto.dmMessage}&rdquo;</p>

                <div className="mt-4 rounded-xl border border-border bg-surface/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      {t("Recommendation")}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        executiveSummary.priority === "Scale"
                          ? "bg-success/10 text-success"
                          : executiveSummary.priority === "Optimize"
                            ? "bg-warning/10 text-warning"
                            : executiveSummary.priority === "Fix"
                              ? "bg-error/10 text-error"
                              : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {t(executiveSummary.priority)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{executiveSummary.recommendation}</p>
                  <p className="mt-2 text-xs text-muted">{t("Next move")}: {executiveSummary.nextAction}</p>
                  <ul className="mt-3 space-y-2 text-xs text-muted">
                    {campaignInsight.actions.slice(0, 2).map((action) => (
                      <li key={action} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-zinc-500">
                  <span>{auto.analytics.sent} {t("sent")}</span>
                  <span>·</span>
                  <span>{auto.analytics.skipped} {t("skipped")}</span>
                  <span>·</span>
                  <span>{auto.analytics.failed} {t("failed")}</span>
                  <span>·</span>
                  <span>{auto.analytics.clicks} {t("clicks")}</span>
                  <span>·</span>
                  <span>{auto.analytics.ctr}% CTR</span>
                  <span>·</span>
                  <span>{auto.wholeWordMatch ? t("Whole word") : t("Partial match")}</span>
                </div>

                {auto.trackedLinks[0] && (
                  <div className="mt-4 rounded-xl border border-border bg-surface/70 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          {t("Tracked link")}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {auto.trackedLinks[0].trackedUrl}
                        </p>
                      </div>
                      <a
                        href={auto.trackedLinks[0].trackedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
                      >
                        {t("Open")}
                      </a>
                    </div>
                  </div>
                )}

                {auto.reportUrl && (
                  <div className="mt-4 rounded-xl border border-border bg-surface/70 p-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          {t("Client report")}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {auto.reportUrl}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleReport(auto.id, auto.reportShareEnabled)
                          }
                          className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            auto.reportShareEnabled
                              ? "border-success/20 text-success hover:bg-success/10"
                              : "border-border text-muted hover:border-border-hover hover:text-foreground"
                          }`}
                        >
                          {auto.reportShareEnabled ? t("Public") : t("Disabled")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard?.writeText(auto.reportUrl ?? "")
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
                        >
                          {t("Copy")}
                        </button>
                        <a
                          href={auto.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
                        >
                          {t("View")}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {auto.analytics.topKeywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {auto.analytics.topKeywords.map((keyword) => (
                      <span
                        key={keyword.keyword}
                        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted"
                      >
                        {keyword.keyword}: {keyword.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`${prefix}/campaigns/${auto.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
                >
                  {t("Open")}
                </Link>

                {/* Toggle */}
                <button
                  onClick={() => toggleActive(auto.id, auto.isActive)}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    ${auto.isActive ? "bg-accent" : "bg-zinc-700"}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm
                      ${auto.isActive ? "left-6" : "left-1"}
                    `}
                  />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteAutomation(auto.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-error hover:bg-error/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
