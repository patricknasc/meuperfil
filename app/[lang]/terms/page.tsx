import { publicTranslator } from "@/lib/i18n/public";
import type { Metadata } from "next";
import LegalShell from "@/components/legal-shell";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = publicTranslator(lang);
  return {
  title: t("Terms of Service - MeuPerfil"),
  description:
    t("Terms for using MeuPerfil's Instagram comment-to-DM campaign software."),
};
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);

  return (
    <LegalShell
      title={t("Terms of Service")}
      description={t("These terms define acceptable use for MeuPerfil's hosted Instagram comment-to-DM campaign service.")}
      updatedAt="May 24, 2026"
      locale={locale}
    >
      <section>
        <h2 className="text-xl font-bold text-white">{t("Authorized Use")}</h2>
        <p className="mt-3">{t("You may use MeuPerfil only with Instagram professional accounts you own or are authorized to manage. You are responsible for the campaigns, keywords, links, and messages you configure.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Platform Compliance")}</h2>
        <p className="mt-3">{t("You agree to follow Meta Platform Terms, Instagram policies, applicable messaging rules, privacy laws, advertising rules, and anti-spam laws. MeuPerfil may rate-limit, pause, or disable campaigns that create compliance, abuse, security, or deliverability risk.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Billing")}</h2>
        <p className="mt-3">{t("Paid plans are billed through Stripe. Plan access is provisioned from Stripe webhook events. Cancellations, failed payments, and subscription changes may change plan limits or reduce access to paid features.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Availability")}</h2>
        <p className="mt-3">{t("MeuPerfil depends on third-party platforms including Meta, Stripe, email, hosting, database, and queue providers. We work to operate the service reliably, but uninterrupted availability is not guaranteed.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Open-Source Core")}</h2>
        <p className="mt-3">{t("The public repository is MIT licensed. Hosted SaaS infrastructure, managed support, agency workflows, analytics, reports, and other paid service features may be provided separately from the open-source core.")}</p>
      </section>
    </LegalShell>
  );
}
