"use client";

/**
 * Top Bar
 *
 * Page title, mobile hamburger, and connection status.
 */

import { usePathname } from "next/navigation";
import { workspaceTranslator } from "@/lib/i18n/workspace";
import LanguageSwitcher from "@/components/language-switcher";
import { IconMenu } from "@/components/app-icons";
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
          aria-label={t("Toggle sidebar")}
        >
          <IconMenu />
        </button>
        <h1 className="truncate font-heading text-xl font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex ${
            instagramAccountCount > 0 ? "border-success/25 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${instagramAccountCount > 0 ? "bg-success" : "bg-warning"}`} />
          {instagramAccountCount > 1
            ? `${instagramAccountCount} ${t("accounts")}`
            : instagramUsername
              ? `@${instagramUsername}`
              : t("Connect Instagram")}
        </span>
        <LanguageSwitcher currentLocale={locale} tone="light" />
      </div>
    </header>
  );
}
