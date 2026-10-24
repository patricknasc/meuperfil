"use client";

/**
 * Sidebar Navigation
 *
 * App navigation with the brand logo, active state and workspace section.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardMessages } from "@/lib/i18n/dashboard";
import type { Locale } from "@/app/[lang]/dictionaries";
import { signOutAction } from "@/lib/auth-actions";
import { Logo } from "@/components/site/logo";
import {
  IconActivity,
  IconCalendar,
  IconLink,
  IconLogOut,
  IconMegaphone,
  IconMessages,
  IconOverview,
  IconSettings,
  IconUsers,
} from "@/components/app-icons";

const navItems = [
  { key: "dashboard", path: "/dashboard", Icon: IconOverview },
  { key: "profiles", path: "/profiles", Icon: IconLink },
  { key: "scheduler", path: "/scheduler", Icon: IconCalendar },
  { key: "campaigns", path: "/campaigns", Icon: IconMegaphone },
  { key: "leads", path: "/leads", Icon: IconUsers },
  { key: "logs", path: "/logs", Icon: IconMessages },
  { key: "settings", path: "/settings", Icon: IconSettings },
  { key: "diagnostics", path: "/diagnostics", Icon: IconActivity },
] as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  plan: string;
}

export default function Sidebar({
  isOpen,
  onClose,
  workspaceName,
  plan,
}: SidebarProps) {
  const pathname = usePathname();

  // Extract locale from pathname (e.g. /pt/dashboard -> pt)
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = (["pt", "en", "es"].includes(segments[0]) ? segments[0] : "pt") as Locale;
  const prefix = `/${currentLocale}`;
  const messages = dashboardMessages(currentLocale);

  const initials = workspaceName
    .split(/[\s.@'_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MP";
  const planLabel = messages.plans[plan as keyof typeof messages.plans] ?? plan;

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center px-5">
          <Link href={`${prefix}/dashboard`} aria-label="meuperfil.me">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {navItems.map(({ key, path, Icon }) => {
            const subPath = pathname.slice(prefix.length) || "/";
            const isActive = subPath === path || subPath.startsWith(path + "/");
            return (
              <Link
                key={key}
                href={`${prefix}${path}`}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-accent/10 text-foreground" : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {isActive && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent" />}
                <Icon className={`h-[18px] w-[18px] ${isActive ? "text-accent" : "text-muted group-hover:text-foreground"}`} />
                {messages[key]}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{workspaceName}</p>
              <span className="mt-0.5 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">{planLabel}</span>
            </div>
          </div>
          <form action={signOutAction.bind(null, currentLocale)} className="mt-1">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <IconLogOut className="h-[18px] w-[18px]" />
              {messages.signOut}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
