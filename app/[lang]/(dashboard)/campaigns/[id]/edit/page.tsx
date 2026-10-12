"use client";

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

  useEffect(() => {
    async function loadCampaign() {
      try {
        const res = await fetch("/api/automations");
        const data = await res.json();
        if (!data.success) {
          setError(data.error ?? "Failed to load campaign");
          return;
        }

        const item = (data.data as CampaignEditPayload[]).find((entry) => entry.id === campaignId) ?? null;
        if (!item) {
          setError("Campaign not found");
          return;
        }

        setCampaign(item);
        setName(item.name);
        setGoal(item.goal ?? "");
        setKeywords(item.keywords);
        setDmMessage(item.dmMessage);
        setWholeWordMatch(item.wholeWordMatch);
        setIsActive(item.isActive);
      } catch {
        setError("Failed to load campaign");
      } finally {
        setLoading(false);
      }
    }

    void loadCampaign();
  }, [campaignId]);

  const title = useMemo(() => {
    if (campaign) return `Edit ${campaign.name}`;
    return "Edit campaign";
  }, [campaign]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !dmMessage.trim() || keywords.length === 0) {
      setError("Name, message, and at least one keyword are required.");
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
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to save campaign");
        return;
      }

      router.push(`${prefix}/campaigns/${campaignId}`);
    } catch {
      setError("Failed to save campaign");
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
        <h2 className="text-lg font-semibold">Campaign not found</h2>
        <p className="mt-2 text-sm text-muted">Try going back to the campaign list.</p>
        <button onClick={() => router.push(`${prefix}/campaigns`)} className="mt-6 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
          Back to campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Campaign settings</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push(`${prefix}/campaigns/${campaignId}`)}
          className="rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Campaign Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent/40"
            placeholder="Campaign name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Campaign Goal</label>
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent/40"
          >
            <option value="">Select a goal</option>
            <option value="Lead magnet delivery">Lead magnet delivery</option>
            <option value="Product link request">Product link request</option>
            <option value="Price or availability reply">Price or availability reply</option>
            <option value="Launch waitlist">Launch waitlist</option>
            <option value="Agency client campaign">Agency client campaign</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Keywords</label>
          <KeywordInput keywords={keywords} onChange={setKeywords} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Private Reply Message</label>
          <textarea
            value={dmMessage}
            onChange={(event) => setDmMessage(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent/40"
            placeholder="Hey {username}! Here is your link..."
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setWholeWordMatch((value) => !value)}
              className={`relative w-11 h-6 rounded-full transition-colors ${wholeWordMatch ? "bg-accent" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${wholeWordMatch ? "left-6" : "left-1"}`} />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">Whole word match</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setIsActive((value) => !value)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-accent" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-6" : "left-1"}`} />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">Campaign active</span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => router.push(`${prefix}/campaigns/${campaignId}`)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
