import { publicTranslator } from "@/lib/i18n/public";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import InvitationAcceptCard from "@/components/invitation-accept-card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { hasLocale, defaultLocale, type Locale } from "../../dictionaries";

type InvitePageProps = {
  params: Promise<{ lang: string; token: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = publicTranslator(lang);
  return {
  title: t("Accept Workspace Invitation - MeuPerfil"),
  robots: { index: false, follow: false },
};
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { lang, token } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);
  const prefix = `/${locale}`;

  const [session, invitation] = await Promise.all([
    auth(),
    prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { name: true } },
      },
    }),
  ]);

  if (!invitation || invitation.status !== "PENDING") {
    notFound();
  }

  const expired = invitation.expiresAt <= new Date();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12">
        <Link href={prefix} className="mb-8 text-sm font-bold text-cyan-100">
          MeuPerfil
        </Link>
        <section className="border border-white/10 bg-white/[0.035] p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">{t("Workspace invitation")}</p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-white">
            {t("Join {workspace}", { workspace: invitation.workspace.name })}
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            {t("You were invited as {role} for {email}.", { role: t(invitation.role.toLowerCase()), email: invitation.email })}
          </p>
          <div className="mt-8">
            {expired ? (
              <p className="text-sm text-error">{t("This invitation has expired. Ask the workspace owner to resend it.")}</p>
            ) : (
              <InvitationAcceptCard
                token={token}
                isSignedIn={Boolean(session?.user?.id)}
                invitedEmail={invitation.email}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
