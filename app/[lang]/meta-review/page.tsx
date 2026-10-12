import { publicTranslator } from "@/lib/i18n/public";
import type { Metadata } from "next";
import LegalShell from "@/components/legal-shell";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = publicTranslator(lang);
  return {
  title: t("Meta App Review Support - MeuPerfil"),
  description:
    t("Meta App Review notes for MeuPerfil's official Instagram private reply workflow."),
};
}

export default async function MetaReviewPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);

  return (
    <LegalShell
      title={t("Meta App Review Support")}
      description={t("MeuPerfil is designed for Instagram professional accounts that want to send private replies after keyword comments on their own posts or reels.")}
      updatedAt="May 24, 2026"
      locale={locale}
    >
      <section>
        <h2 className="text-xl font-bold text-white">{t("User Flow")}</h2>
        <p className="mt-3">{t("A business owner signs in by email, connects an Instagram professional account through Meta OAuth, creates a keyword campaign for a post or reel, and receives a webhook when someone comments. MeuPerfil queues the event, deduplicates it, checks plan and rate limits, then sends a private reply using the comment ID.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Compliance Position")}</h2>
        <p className="mt-3">{t("The app uses official Meta APIs, verifies webhook signatures, encrypts tokens, avoids scraping, avoids password collection, and sends no more than one private reply for a matched campaign/comment pair.")}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">{t("Review Test Notes")}</h2>
        <p className="mt-3">{t("Reviewers can use a Meta test business, connect an Instagram professional account, create a keyword such as LINK, comment that keyword on the selected media, and confirm that the private reply is sent and logged once.")}</p>
      </section>
    </LegalShell>
  );
}
