"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import { siteFontVariables } from "@/lib/site/fonts";
import { DialogsProvider } from "@/components/app-dialogs";
import type { Locale } from "@/app/[lang]/dictionaries";

interface DashboardShellProps {
  children: React.ReactNode;
  workspaceName: string;
  plan: string;
  instagramUsername: string | null;
  instagramAccountCount: number;
  locale?: Locale;
}

export default function DashboardShell({
  children,
  workspaceName,
  plan,
  instagramUsername,
  instagramAccountCount,
  locale = "pt",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DialogsProvider>
    <div className={`${siteFontVariables} flex h-screen overflow-hidden bg-background font-site text-foreground`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        workspaceName={workspaceName}
        plan={plan}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          instagramUsername={instagramUsername}
          instagramAccountCount={instagramAccountCount}
          locale={locale}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
    </DialogsProvider>
  );
}
