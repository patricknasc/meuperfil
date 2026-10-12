import { publicTranslator } from "@/lib/i18n/public";
import type { Metadata } from "next";
import LegalShell from "@/components/legal-shell";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = publicTranslator(lang);
  return {
  title: t("Privacy Policy - MeuPerfil"),
  description:
    t("How MeuPerfil handles Instagram account data, webhook payloads, billing data, and customer campaign information."),
};
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);

  return (
    <LegalShell
      title={t("Privacy Policy")}
      description={t("MeuPerfil helps businesses send Meta-compliant private replies when people comment on connected Instagram posts or reels.")}
      updatedAt="May 24, 2026"
      locale={locale}
    >
      <section>
        <h2 className="text-xl font-bold text-white">{t("Data We Collect")}</h2>
        <p className="mt-3">{t("We collect account email addresses for authentication, workspace and billing metadata, connected Instagram account identifiers, encrypted Instagram access tokens, campaign settings, webhook payloads, comments needed to process campaigns, delivery logs, and operational diagnostics.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("How We Use Data")}</h2>
        <p className="mt-3">{t("We use this data to authenticate users, connect Instagram integrations, match comment keywords, send private replies through the official Meta APIs, enforce plan limits, process billing, prevent duplicate sends, troubleshoot failures, and protect the service.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Instagram And Meta Data")}</h2>
        <p className="mt-3">{t("MeuPerfil does not ask for Instagram passwords, scrape Instagram, or use browser automation. Instagram tokens are encrypted at rest and are used only to perform actions authorized by the connected business account.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Subprocessors")}</h2>
        <p className="mt-3">{t("The production service may use hosting, database, Redis queue, email, billing, and observability providers such as Vercel, Railway, PostgreSQL, Redis, Resend, and Stripe. These providers process data only as needed to run the service.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Retention And Deletion")}</h2>
        <p className="mt-3">{t("Customers can disconnect Instagram from settings, which removes the stored Instagram connection and stops campaigns. For account or data deletion, follow the Data Deletion page linked from the footer.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Contact")}</h2>
        <p className="mt-3">{t("For privacy questions, contact the repository owner through GitHub or the support email configured for the hosted MeuPerfil service.")}</p>
      </section>
    </LegalShell>
  );
}
