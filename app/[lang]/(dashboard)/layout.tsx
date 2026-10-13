import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { getEffectivePlan } from "@/lib/billing/plans";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const workspace = await ensureWorkspaceForUser(
    session.user.id,
    session.user.email
  );
  const accounts = await prisma.instagramAccount.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { connectedAt: "desc" },
    select: { username: true },
  });

  return (
    <DashboardShell
      workspaceName={workspace.name}
      plan={getEffectivePlan(workspace.plan, workspace.subscriptionStatus)}
      instagramUsername={accounts[0]?.username ?? null}
      instagramAccountCount={accounts.length}
      locale={locale}
    >
      {children}
    </DashboardShell>
  );
}
