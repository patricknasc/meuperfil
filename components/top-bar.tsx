"use client";

/**
 * Top Bar
 *
 * Page title, mobile hamburger, and connection status.
 */

import { usePathname } from "next/navigation";
import { workspaceTranslator } from "@/lib/i18n/workspace";
import LanguageSwitcher from "@/components/language-switcher";
import type { Locale } from "@/app/[lang]/dictionaries";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/campaigns": "Campaigns",
  "/campaigns/new": "New Campaign",
  "/automations": "Campaigns",
  "/automations/new": "New Campaign",
  "/logs": "DM Logs",
  "/settings": "Settings",
  "/diagnostics": "Diagnostics",
  "/scheduler": "Scheduler",
  "/profiles": "Bio link",
  "/leads": "Leads",
};

interface TopBarProps {
  onMenuClick: () => void;
  instagramUsername: string | null;
  instagramAccountCount: number;
  locale?: Locale;
}

export default function TopBar({
  onMenuClick,
  instagramUsername,
  instagramAccountCount,
  locale = "pt",
}: TopBarProps) {
  const t = workspaceTranslator(locale);
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(en|pt|es)/, "") || "/";
  const fallbackTitle = normalizedPath.startsWith("/profiles/")
    ? "Bio link"
    : /\/(campaigns|automations)\/[^/]+\/edit$/.test(normalizedPath)
      ? "Edit Campaign"
      : /\/(campaigns|automations)\/[^/]+$/.test(normalizedPath)
        ? "Campaign"
        : "Dashboard";
  const title = t(pageTitles[normalizedPath] ?? fallbackTitle);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 border-b border-border glass">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label={t("Toggle sidebar")}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      {/* Right: status and language switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs text-muted">
          <div
            className={`w-2 h-2 rounded-full ${
              instagramAccountCount > 0 ? "bg-success animate-pulse" : "bg-warning"
            }`}
          />
          {instagramAccountCount > 1
            ? `${instagramAccountCount} ${t("accounts")}`
            : instagramUsername
              ? `@${instagramUsername}`
              : t("Connect Instagram")}
        </div>
        <LanguageSwitcher currentLocale={locale} />
      </div>
    </header>
  );
}
