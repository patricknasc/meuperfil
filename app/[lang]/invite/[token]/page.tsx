import { publicTranslator } from "@/lib/i18n/public";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { siteFontVariables } from "@/lib/site/fonts";
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
    <div className={`${siteFontVariables} flex min-h-screen flex-col bg-paper font-site text-ink`}>
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8">
        <Link href={prefix} aria-label="meuperfil.me">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <section className="w-full max-w-md rounded-[2rem] bg-white p-8 ring-1 ring-line shadow-[0_30px_60px_-40px_rgba(22,18,15,.45)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-coral-dark">{t("Workspace invitation")}</p>
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight">
            {t("Join {workspace}", { workspace: invitation.workspace.name })}
          </h1>
          <p className="mt-3 leading-7 text-ink-soft">
            {t("You were invited as {role} for {email}.", { role: t(invitation.role.toLowerCase()), email: invitation.email })}
          </p>
          <div className="mt-8">
            {expired ? (
              <p className="rounded-2xl bg-coral-soft p-4 text-sm font-medium text-coral-dark">{t("This invitation has expired. Ask the workspace owner to resend it.")}</p>
            ) : (
              <InvitationAcceptCard token={token} isSignedIn={Boolean(session?.user?.id)} invitedEmail={invitation.email} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
