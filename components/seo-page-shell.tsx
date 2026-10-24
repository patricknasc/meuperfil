import { seoTranslator } from "@/lib/i18n/seo";
import Link from "next/link";
import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import { siteFontVariables } from "@/lib/site/fonts";
import type { Locale } from "@/app/[lang]/dictionaries";

export interface SeoPageSection {
  title: string;
  body: string;
}

export interface SeoPageConfig {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta?: string;
  bullets: string[];
  sections: SeoPageSection[];
  comparisonTitle: string;
  comparisons: Array<{
    label: string;
    meuPerfil: string;
    other: string;
  }>;
  templateLinks: Array<{
    label: string;
    href: string;
  }>;
  faqs: SeoPageSection[];
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function SeoPageShell({
  config,
  locale = "pt",
}: {
  config: SeoPageConfig;
  locale?: Locale;
}) {
  const t = seoTranslator(locale);
  const prefix = `/${locale}`;

  return (
    <div className={`${siteFontVariables} min-h-screen overflow-x-clip bg-paper font-site text-ink`}>
      <SiteHeader locale={locale} />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pt-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-coral-dark">{config.eyebrow}</p>
            <h1 className="mt-4 text-balance font-heading text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">{config.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">{config.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`${prefix}/login`} className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-coral-dark">
                {config.primaryCta}
              </Link>
              <Link href={`${prefix}/templates`} className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-7 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/40">
                {config.secondaryCta ?? t("Browse templates")}
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-7 ring-1 ring-line">
            <ul className="space-y-4">
              {config.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-[15px] leading-7 text-ink-soft">
                  <span className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-paper">
                    <CheckIcon />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-line bg-paper-2 py-20">
          <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:px-8 md:grid-cols-3">
            {config.sections.map((section) => (
              <article key={section.title} className="rounded-3xl bg-white p-7 ring-1 ring-line">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">{section.title}</h2>
                <p className="mt-3 leading-7 text-ink-soft">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">{config.comparisonTitle}</h2>
          <div className="mt-8 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
            <div className="hidden grid-cols-[.8fr_1fr_1fr] border-b border-line bg-paper text-xs font-semibold uppercase tracking-[.12em] text-ink-muted md:grid">
              <div className="p-4">{t("Need")}</div>
              <div className="p-4 text-coral-dark">MeuPerfil</div>
              <div className="p-4">{t("Generic automation")}</div>
            </div>
            {config.comparisons.map((item) => (
              <div key={item.label} className="grid grid-cols-1 border-b border-line last:border-0 md:grid-cols-[.8fr_1fr_1fr]">
                <div className="p-4 text-sm font-semibold text-ink">{item.label}</div>
                <div className="px-4 pb-2 text-sm leading-6 text-ink-soft md:p-4">{item.meuPerfil}</div>
                <div className="px-4 pb-4 text-sm leading-6 text-ink-muted md:p-4">{item.other}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-paper-2 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-coral-dark">{t("Start from a template")}</p>
              <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("Launch a campaign faster than building a chatbot flow")}</h2>
              <p className="mt-4 leading-7 text-ink-soft">
                {t("Use a campaign template, connect the right Instagram account, pick the post, and ship a measurable comment-to-DM loop.")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {config.templateLinks.map((link) => (
                <Link key={link.href} href={`${prefix}${link.href}`} className="flex items-center justify-between rounded-2xl bg-white p-5 text-sm font-semibold text-ink ring-1 ring-line transition hover:ring-ink/30">
                  {link.label}
                  <span aria-hidden="true" className="text-coral">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <h2 className="text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("Search questions, answered clearly")}</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {config.faqs.map((faq) => (
              <details key={faq.title} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.title}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pr-12 leading-7 text-ink-soft">{faq.body}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] bg-coral p-10 text-center text-white sm:p-14">
            <h2 className="mx-auto max-w-2xl text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {t("Turn the next high-intent comment into a private reply")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              {t("MeuPerfil is built for Instagram professional accounts, official Meta private replies, and campaign reporting teams can show clients.")}
            </p>
            <Link href={`${prefix}/login`} className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition hover:bg-black">
              {t("Start free")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
