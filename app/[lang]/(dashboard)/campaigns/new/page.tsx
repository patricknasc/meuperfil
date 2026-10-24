"use client";
import CampaignExtraOptions, { endOfDayIso } from "@/components/campaign-extra-options";
import { campaignTranslator } from "@/lib/i18n/campaigns";
import { localizeCampaignTemplate } from "@/lib/i18n/templates";

/**
 * New Campaign Page
 *
 * Form to create a new campaign with goal, account, post picker, keywords, DM message, and active state.
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import KeywordInput from "@/components/keyword-input";
import PostPicker from "@/components/post-picker";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import {
  extractFirstUrl,
  replaceUrlWithTrackedPlaceholder,
} from "@/lib/tracking/message";

export default function NewCampaignPage() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = ["pt", "en", "es"].includes(segments[0]) ? segments[0] : "pt";
  const prefix = `/${currentLocale}`;
  const t = campaignTranslator(currentLocale);
  const searchParams = useSearchParams();
  const sourceTemplate = getCampaignTemplate(searchParams.get("template"));
  const selectedTemplate = sourceTemplate ? localizeCampaignTemplate(sourceTemplate, currentLocale) : null;
  const templateDestinationUrl = selectedTemplate
    ? extractFirstUrl(selectedTemplate.dmMessage)
    : null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(selectedTemplate?.title ?? "");
  const [goal, setGoal] = useState(selectedTemplate?.goal ?? "");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [postId, setPostId] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string | undefined>();
  const [keywords, setKeywords] = useState<string[]>(
    selectedTemplate?.keywords ?? []
  );
  const [dmMessage, setDmMessage] = useState(
    selectedTemplate
      ? replaceUrlWithTrackedPlaceholder(
          selectedTemplate.dmMessage,
          templateDestinationUrl
        )
      : ""
  );
  const [trackedDestinationUrl, setTrackedDestinationUrl] = useState(
    templateDestinationUrl ?? ""
  );
  const [wholeWordMatch, setWholeWordMatch] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [typoTolerance, setTypoTolerance] = useState(false);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) {
          const nextAccounts = payload.data.instagramAccounts ?? [];
          setAccounts(nextAccounts);
          setSelectedAccountId(
            payload.data.selectedInstagramAccountId ??
              nextAccounts[0]?.id ??
              ""
          );
        }
      })
      .catch(() => {
        setAccounts([]);
        setSelectedAccountId("");
      });
  }, []);

  function handleAccountChange(accountId: string) {
    setSelectedAccountId(accountId);
    setPostId(null);
    setPostUrl(undefined);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = [
      !name && t("Campaign name"),
      !goal && t("Campaign goal"),
      !postId && t("Post or Reel"),
      keywords.length === 0 && t("Comment keywords"),
      !dmMessage && t("DM message"),
    ].filter(Boolean);
    if (missing.length > 0) {
      setError(`${t("Fill in:")} ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          goal,
          instagramAccountId: selectedAccountId,
          postId,
          postUrl: postUrl ?? null,
          keywords,
          dmMessage,
          trackedDestinationUrl: trackedDestinationUrl || null,
          wholeWordMatch,
          isActive,
          typoTolerance,
          endsAt: endOfDayIso(endDate),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`${prefix}/campaigns`);
      } else {
        setError(data.error ?? t("Failed to create campaign"));
      }
    } catch {
      setError(t("Failed to create campaign"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        {selectedTemplate && (
          <div className="border border-cyan-200/20 bg-cyan-300/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">{t("Template loaded")}</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {selectedTemplate.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-300">{t("Pick the Instagram post or reel, adjust the copy, and launch when the connection is ready.")}</p>
          </div>
        )}

        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Campaign Name")}<span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("e.g. Product launch link drop")}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors"
            maxLength={100}
          />
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Campaign Goal")}<span className="text-error">*</span>
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground focus:border-accent/40 focus:outline-none transition-colors"
          >
            <option value="">{t("Select a goal")}</option>
            <option value="Lead magnet delivery">{t("Lead magnet delivery")}</option>
            <option value="Product link request">{t("Product link request")}</option>
            <option value="Price or availability reply">{t("Price or availability reply")}</option>
            <option value="Launch waitlist">{t("Launch waitlist")}</option>
            <option value="Agency client campaign">{t("Agency client campaign")}</option>
          </select>
        </div>

        {/* Instagram Account */}
        <div className="space-y-2">
          <p className="block text-sm font-medium text-foreground">{t("Instagram Account")}<span className="text-error">*</span>
          </p>
          {accounts.length > 0 ? (
            <AccountSelect
              accounts={accounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
              includeAll={false}
              label={t("Connected profile")}
            />
          ) : (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground">{t("Connect Instagram before launching a campaign")}</div>
          )}
        </div>

        {/* Post Picker */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Campaign Post Or Reel")}<span className="text-error">*</span>
          </label>
          <p className="text-xs text-muted mb-3">{t("Choose which Instagram post or reel should trigger the campaign.")}</p>
          <div className="glass rounded-xl p-4">
            <PostPicker
              selectedPostId={postId}
              instagramAccountId={selectedAccountId}
              onSelect={(id, url) => {
                setPostId(id);
                setPostUrl(url);
              }}
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Comment Keywords")}<span className="text-error">*</span>
          </label>
          <p className="text-xs text-muted mb-1">{t("When someone comments any of these keywords, the campaign sends the private reply.")}</p>
          <KeywordInput keywords={keywords} onChange={setKeywords} />
        </div>

        {/* DM Message */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Private Reply Message")}<span className="text-error">*</span>
          </label>
          <textarea
            value={dmMessage}
            onChange={(e) => setDmMessage(e.target.value)}
            placeholder={t("Hey {username}! Here's the link you asked for: https://...")}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-muted">{t("Use")}<code className="px-1 py-0.5 rounded bg-surface-hover text-accent font-mono text-[11px]">{"{username}"}</code>{t("to personalize with the commenter's name")}</p>
        </div>

        {/* Tracked Link */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">{t("Tracked Destination URL")}</label>
          <input
            type="url"
            value={trackedDestinationUrl}
            onChange={(e) => setTrackedDestinationUrl(e.target.value)}
            placeholder={t("https://yourlink.com/offer")}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">{t("Add")}<code className="px-1 py-0.5 rounded bg-surface-hover text-accent font-mono text-[11px]">{"{link}"}</code>{t("to send the tracked redirect.")}</p>
            <button
              type="button"
              onClick={() =>
                setDmMessage((current) =>
                  current.includes("{link}") ? current : `${current.trim()} {link}`.trim()
                )
              }
              className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
            >{t("Insert link token")}</button>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setWholeWordMatch(!wholeWordMatch)}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${wholeWordMatch ? "bg-accent" : "bg-zinc-700"}
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm
                  ${wholeWordMatch ? "left-6" : "left-1"}
                `}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">{t("Whole word match")}</span>
              <p className="text-xs text-muted">
                {wholeWordMatch
                  ? t("Exact word: \"linking\" will not trigger \"LINK\"")
                  : t("Partial match: \"linking\" will trigger \"LINK\"")}
              </p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${isActive ? "bg-accent" : "bg-zinc-700"}
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm
                  ${isActive ? "left-6" : "left-1"}
                `}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-foreground">{t("Launch active")}</span>
              <p className="text-xs text-muted">
                {isActive ? t("Campaign starts listening after creation") : t("Campaign is saved paused")}
              </p>
            </div>
          </label>
          <CampaignExtraOptions
            typoTolerance={typoTolerance}
            onTypoToleranceChange={setTypoTolerance}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {/* Submit */}
        {error && (
          <div role="alert" className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>{t("Creating...")}</>
            ) : (
              t("Create Campaign")
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border transition-colors"
          >{t("Cancel")}</button>
        </div>
      </form>
    </div>
  );
}
