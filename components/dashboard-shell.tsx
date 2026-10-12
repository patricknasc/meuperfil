"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
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
    <div className="flex h-screen overflow-hidden bg-background">
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
          <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
