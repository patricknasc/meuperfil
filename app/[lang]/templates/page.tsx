import { publicTranslator } from "@/lib/i18n/public";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import { siteFontVariables } from "@/lib/site/fonts";
import TemplateVisual from "@/components/template-visual";
import { localizeCampaignTemplate } from "@/lib/i18n/templates";
import { CAMPAIGN_TEMPLATES } from "@/lib/templates/campaign-templates";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = publicTranslator(lang);
  return {
  title: t("Instagram Comment to DM Templates - MeuPerfil"),
  description:
    t("Copy ready-to-launch Instagram comment-to-DM campaign templates for product links, lead magnets, real estate, fitness, restaurants, events, and creators."),
  keywords: [
    "Instagram comment to DM templates",
    "comment to DM campaigns",
    "Instagram DM automation templates",
    "Manychat alternative templates",
  ],
};
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);
  const templates = CAMPAIGN_TEMPLATES.map((template) => localizeCampaignTemplate(template, locale));
  const prefix = `/${locale}`;

  return (
    <div className={`${siteFontVariables} min-h-screen overflow-x-clip bg-paper font-site text-ink`}>
      <SiteHeader locale={locale} />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:pt-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-coral-dark">{t("Public template library")}</p>
            <h1 className="mt-4 text-balance font-heading text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">{t("Instagram campaigns you can copy in minutes")}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">{t("Start with proven comment-to-DM playbooks for lead magnets, product links, events, service menus, and agency client campaigns.")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`${prefix}/login`} className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-coral-dark">{t("Start free")}</Link>
              <a href="#template-grid" className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-7 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/40">{t("Browse templates")}</a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.slice(0, 2).map((template) => (
              <TemplateVisual key={template.slug} template={template} compact />
            ))}
          </div>
        </section>

        <section id="template-grid" className="scroll-mt-20 border-t border-line bg-paper-2 py-20">
          <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <article key={template.slug} className="flex flex-col rounded-3xl bg-white p-5 ring-1 ring-line">
                <TemplateVisual template={template} compact />
                <p className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-coral-dark">{template.category}</p>
                <h2 className="mt-2 font-heading text-xl font-semibold leading-tight tracking-tight">{template.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{template.summary}</p>
                <div className="mt-auto grid gap-2 pt-6">
                  <Link href={`${prefix}/login?template=${template.slug}`} className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper transition hover:bg-coral-dark">{t("Use this template")}</Link>
                  <Link href={`${prefix}/templates/${template.slug}`} className="inline-flex items-center justify-center rounded-full border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink/40">{t("View playbook")}</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
