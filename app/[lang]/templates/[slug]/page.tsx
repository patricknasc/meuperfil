import { publicTranslator } from "@/lib/i18n/public";
import { localizeCampaignTemplate } from "@/lib/i18n/templates";
import { campaignTranslator } from "@/lib/i18n/campaigns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import { siteFontVariables } from "@/lib/site/fonts";
import TemplateVisual from "@/components/template-visual";
import {
  CAMPAIGN_TEMPLATES,
  getCampaignTemplate,
  getCampaignTemplateSlugs,
} from "@/lib/templates/campaign-templates";
import { locales, hasLocale, defaultLocale, type Locale } from "../../dictionaries";

type TemplatePageProps = {
  params: Promise<{ lang: string; slug: string }>;
};

export function generateStaticParams() {
  const slugs = getCampaignTemplateSlugs();
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({
  params,
}: TemplatePageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const t = publicTranslator(lang);
  const sourceTemplate = getCampaignTemplate(slug);
  const template = sourceTemplate ? localizeCampaignTemplate(sourceTemplate, lang) : null;

  if (!template) {
    return {
      title: t("Template Not Found - MeuPerfil"),
    };
  }

  return {
    title: t("{title} - Instagram Comment to DM Template", { title: template.title }),
    description: template.summary,
    keywords: [
      `${template.title} template`,
      "Instagram comment to DM template",
      "Instagram DM campaign template",
      template.category,
      template.audience,
    ],
  };
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { lang, slug } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);
  const prefix = `/${locale}`;
  const sourceTemplate = getCampaignTemplate(slug);
  const template = sourceTemplate ? localizeCampaignTemplate(sourceTemplate, lang) : null;

  if (!template) {
    notFound();
  }

  const relatedTemplates = CAMPAIGN_TEMPLATES.filter(
    (item) => item.slug !== template.slug
  ).slice(0, 3).map((template) => localizeCampaignTemplate(template, locale));

  const card = "rounded-3xl bg-white p-6 ring-1 ring-line";
  const label = "text-xs font-semibold uppercase tracking-[.12em] text-ink-muted";

  return (
    <div className={`${siteFontVariables} min-h-screen overflow-x-clip bg-paper font-site text-ink`}>
      <SiteHeader locale={locale} />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:pt-14">
          <div>
            <Link href={`${prefix}/templates`} className="text-sm font-medium text-ink-muted transition hover:text-ink">← {t("Back to templates")}</Link>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[.16em] text-coral-dark">{template.category} · {t("template")}</p>
            <h1 className="mt-3 text-balance font-heading text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl">{template.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-soft">{template.summary}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`${prefix}/login?template=${template.slug}`} className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-coral-dark">{t("Use this template")}</Link>
              <a href="#playbook" className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-7 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/40">{t("Read playbook")}</a>
            </div>
          </div>
          <TemplateVisual template={template} />
        </section>

        <section className="border-t border-line bg-paper-2 py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-8 lg:grid-cols-[.75fr_1.25fr]">
            <aside className="space-y-4">
              <div className={card}><p className={label}>{t("Audience")}</p><p className="mt-2 font-heading text-lg font-semibold">{template.audience}</p></div>
              <div className={card}><p className={label}>{t("Setup time")}</p><p className="mt-2 font-heading text-lg font-semibold">{template.setupMinutes} {t("minutes")}</p></div>
              <div className={card}><p className={label}>{t("Campaign goal")}</p><p className="mt-2 font-heading text-lg font-semibold">{campaignTranslator(locale)(template.goal)}</p></div>
            </aside>

            <div id="playbook" className="scroll-mt-24 space-y-6">
              <section className={card}>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("Campaign Outcome")}</h2>
                <p className="mt-3 leading-8 text-ink-soft">{template.outcome}</p>
              </section>
              <section className={card}>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("Setup Playbook")}</h2>
                <ol className="mt-5 space-y-4">
                  {template.playbook.map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-paper">{index + 1}</span>
                      <span className="pt-1 leading-7 text-ink-soft">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="grid gap-5 md:grid-cols-2">
                {[
                  [t("Best For"), template.bestFor],
                  [t("Metrics To Watch"), template.metrics],
                ].map(([title, items]) => (
                  <div key={title as string} className={card}>
                    <h2 className="font-heading text-xl font-semibold tracking-tight">{title as string}</h2>
                    <ul className="mt-4 space-y-2.5">
                      {(items as string[]).map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6 text-ink-soft">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
              <section className="rounded-3xl bg-coral p-7 text-white">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight">{t("Copy this campaign into MeuPerfil")}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/85">{t("Sign in, connect Instagram, pick a post or reel, and the template copy will be ready for your campaign draft.")}</p>
                  </div>
                  <Link href={`${prefix}/login?template=${template.slug}`} className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-black">{t("Use this template")}</Link>
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">{t("More templates")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedTemplates.map((item) => (
              <Link key={item.slug} href={`${prefix}/templates/${item.slug}`} className="rounded-3xl bg-white p-6 ring-1 ring-line transition hover:ring-ink/30">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-coral-dark">{item.category}</p>
                <h3 className="mt-2 font-heading text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{item.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
