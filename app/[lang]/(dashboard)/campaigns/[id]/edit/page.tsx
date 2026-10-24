"use client";
import CampaignExtraOptions, { endOfDayIso, isoToDateInput } from "@/components/campaign-extra-options";
import { campaignTranslator } from "@/lib/i18n/campaigns";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import KeywordInput from "@/components/keyword-input";

interface CampaignEditPayload {
  id: string;
  name: string;
  goal: string | null;
  keywords: string[];
  dmMessage: string;
  isActive: boolean;
  wholeWordMatch: boolean;
  typoTolerance?: boolean;
  endsAt?: string | null;
  instagramAccount: {
    username: string;
  };
}

export default function CampaignEditPage() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = ["pt", "en", "es"].includes(segments[0]) ? segments[0] : "pt";
  const prefix = `/${currentLocale}`;
  const t = campaignTranslator(currentLocale);
  const campaignId = segments[segments.length - 2];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignEditPayload | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [dmMessage, setDmMessage] = useState("");
  const [wholeWordMatch, setWholeWordMatch] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [typoTolerance, setTypoTolerance] = useState(false);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function loadCampaign() {
      try {
        const res = await fetch("/api/automations");
        const data = await res.json();
        if (!data.success) {
          setError(data.error ?? t("Failed to load campaign"));
          return;
        }

        const item = (data.data as CampaignEditPayload[]).find((entry) => entry.id === campaignId) ?? null;
        if (!item) {
          setError(t("Campaign not found"));
          return;
        }

        setCampaign(item);
        setName(item.name);
        setGoal(item.goal ?? "");
        setKeywords(item.keywords);
        setDmMessage(item.dmMessage);
        setWholeWordMatch(item.wholeWordMatch);
        setIsActive(item.isActive);
        setTypoTolerance(Boolean(item.typoTolerance));
        setEndDate(isoToDateInput(item.endsAt));
      } catch {
        setError(t("Failed to load campaign"));
      } finally {
        setLoading(false);
      }
    }

    void loadCampaign();
  }, [campaignId, t]);

  const title = useMemo(() => {
    if (campaign) return `Edit ${campaign.name}`;
    return t("Edit campaign");
  }, [campaign, t]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !dmMessage.trim() || keywords.length === 0) {
      setError(t("Name, message, and at least one keyword are required."));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/automations?id=${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          goal: goal.trim() || null,
          keywords,
          dmMessage: dmMessage.trim(),
          wholeWordMatch,
          isActive,
          typoTolerance,
          endsAt: endOfDayIso(endDate),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? t("Failed to save campaign"));
        return;
      }

      router.push(`${prefix}/campaigns/${campaignId}`);
    } catch {
      setError(t("Failed to save campaign"));
    } finally {
      setSaving(false);
    }
  }

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
        <h2 className="text-lg font-semibold">{t("Campaign not found")}</h2>
        <p className="mt-2 text-sm text-muted">{t("Try going back to the campaign list.")}</p>
        <button onClick={() => router.push(`${prefix}/campaigns`)} className="mt-6 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">{t("Back to campaigns")}</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{t("Campaign settings")}</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">{title}</h2>
        </div>
        <button
          type="button"
          onClick={() => router.push(`${prefix}/campaigns/${campaignId}`)}
          className="rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
        >{t("Cancel")}</button>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Campaign Name")}</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent/40"
            placeholder={t("Campaign name")}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Campaign Goal")}</label>
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent/40"
          >
            <option value="">{t("Select a goal")}</option>
            <option value="Lead magnet delivery">{t("Lead magnet delivery")}</option>
            <option value="Product link request">{t("Product link request")}</option>
            <option value="Price or availability reply">{t("Price or availability reply")}</option>
            <option value="Launch waitlist">{t("Launch waitlist")}</option>
            <option value="Agency client campaign">{t("Agency client campaign")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Keywords")}</label>
          <KeywordInput keywords={keywords} onChange={setKeywords} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Private Reply Message")}</label>
          <textarea
            value={dmMessage}
            onChange={(event) => setDmMessage(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent/40"
            placeholder={t("Hey {username}! Here is your link...")}
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setWholeWordMatch((value) => !value)}
              className={`relative w-11 h-6 rounded-full transition-colors ${wholeWordMatch ? "bg-accent" : "bg-border"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${wholeWordMatch ? "left-6" : "left-1"}`} />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">{t("Whole word match")}</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setIsActive((value) => !value)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-accent" : "bg-border"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-6" : "left-1"}`} />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">{t("Campaign active")}</span>
            </div>
          </label>
          <CampaignExtraOptions
            typoTolerance={typoTolerance}
            onTypoToleranceChange={setTypoTolerance}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => router.push(`${prefix}/campaigns/${campaignId}`)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground"
          >{t("Back")}</button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-coral to-coral-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-coral/20 disabled:opacity-60"
          >
            {saving ? t("Saving...") : t("Save changes")}
          </button>
        </div>
      </form>
    </div>
  );
}
