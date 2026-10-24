import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import { SocialGlyph } from "@/components/social-icon";
import { getSiteCopy, type SiteCopy } from "@/lib/i18n/site";
import { siteFontVariables } from "@/lib/site/fonts";
import { betaWaitlistSchema, normalizeBetaWaitlistEntry } from "@/lib/beta/waitlist";
import { saveBetaWaitlistEntry } from "@/lib/beta/storage";
import { sendBetaWelcomeEmail } from "@/lib/beta/email";
import { hasLocale, defaultLocale, type Locale } from "./dictionaries";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ beta?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const copy = getSiteCopy(hasLocale(lang) ? lang : defaultLocale);
  return { title: copy.meta.title, description: copy.meta.description };
}

async function submitWaitlist(formData: FormData) {
  "use server";
  const localeValue = String(formData.get("locale") ?? defaultLocale);
  const locale = hasLocale(localeValue) ? localeValue : defaultLocale;
  const parsed = betaWaitlistSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    company: String(formData.get("company") ?? ""),
    goal: "",
    source: "landing-page",
  });
  if (!parsed.success) redirect(`/${locale}?beta=invalid#contato`);
  const entry = normalizeBetaWaitlistEntry(parsed.data);
  await saveBetaWaitlistEntry(entry);
  await sendBetaWelcomeEmail({ name: entry.name, email: entry.email, company: entry.company, goal: entry.goal });
  redirect(`/${locale}?beta=success#contato`);
}

/* ─── Small pieces ─────────────────────────────────────────────────────────── */

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

function Check({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[.16em] text-coral-dark">{children}</p>;
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`mt-4 text-balance font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl ${className}`}>
      {children}
    </h2>
  );
}

const SOCIAL_ROW = ["instagram", "whatsapp", "tiktok", "youtube"];

/* ─── Product visuals (illustrative, built with real UI primitives) ───────── */

function HeroVisual({ copy }: { copy: SiteCopy }) {
  return (
    <div className="relative mx-auto w-full max-w-[520px] px-4 pb-16 pt-6 sm:px-0 lg:mx-0 lg:ml-auto">
      <div aria-hidden="true" className="absolute inset-x-0 top-16 bottom-0 -z-10 rounded-[3rem] bg-coral-soft" />
      {/* Floating cards are positioned around the phone, never over its content. */}
      <div className="relative mx-auto w-[260px] sm:w-[290px]">
        <div className="rounded-[2.8rem] bg-ink p-2.5 shadow-[0_40px_80px_-30px_rgba(22,18,15,.55)]">
          <div className="overflow-hidden rounded-[2.3rem] bg-[linear-gradient(170deg,#fff6ee,#fde4da_55%,#f9cdbd)] px-5 pb-8 pt-10">
            <div className="mx-auto h-[68px] w-[68px] rounded-full bg-[conic-gradient(from_200deg,#ee4f2b,#f7a35c,#ee4f2b)] p-[3px]">
              <div className="grid h-full w-full place-items-center rounded-full bg-paper font-heading text-xl font-bold text-coral-dark">AL</div>
            </div>
            <p className="mt-3 text-center font-heading text-lg font-bold text-ink">{copy.demo.name}</p>
            <p className="mx-auto mt-1 max-w-[200px] text-center text-xs leading-5 text-ink-soft">{copy.demo.bio}</p>
            <div className="mt-4 flex justify-center gap-2">
              {SOCIAL_ROW.map((platform) => (
                <span key={platform} className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper">
                  <SocialGlyph platform={platform} className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-2.5">
              {copy.demo.links.map((label, i) => (
                <div
                  key={label}
                  className={`rounded-2xl px-4 py-3 text-center text-[13px] font-semibold ${
                    i === 0 ? "bg-ink text-paper" : "bg-white/80 text-ink ring-1 ring-ink/10"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment: above-left of the phone */}
        <div className="absolute -left-6 -top-4 w-[190px] rounded-2xl bg-white p-3 shadow-[0_20px_40px_-18px_rgba(22,18,15,.35)] ring-1 ring-line sm:-left-48 sm:top-8 sm:w-[215px] sm:p-3.5">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[linear-gradient(135deg,#7c5cff,#ee4f2b)]" />
            <p className="text-xs font-semibold text-ink">{copy.demo.commentUser}</p>
          </div>
          <p className="mt-2 text-sm text-ink">{copy.demo.comment}</p>
          <p className="mt-2 flex items-start gap-1 text-[11px] font-medium leading-4 text-moss">
            <Check className="mt-px h-3 w-3 shrink-0" /> {copy.demo.matched}
          </p>
        </div>

        {/* DM: below-right of the phone */}
        <div className="absolute -bottom-12 -right-6 w-[210px] rounded-2xl rounded-br-md bg-ink p-3.5 text-paper shadow-[0_20px_40px_-18px_rgba(22,18,15,.55)] sm:-right-36 sm:-bottom-10 sm:w-[225px]">
          <div className="flex items-center gap-1.5 text-[11px] text-paper/60">
            <SocialGlyph platform="instagram" className="h-3 w-3" /> Direct
          </div>
          <p className="mt-1.5 text-[13px] leading-5">{copy.demo.dmGreeting}</p>
          <p className="mt-1 text-[13px] font-semibold text-[#ffb59f] underline decoration-[#ffb59f]/40 underline-offset-2">{copy.demo.dmLink}</p>
        </div>

        {/* Clicks: right side, mid-height (desktop only) */}
        <div className="absolute -right-32 top-40 hidden rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-[0_12px_30px_-14px_rgba(22,18,15,.35)] ring-1 ring-line sm:block">
          <span className="text-moss">+48</span> {copy.demo.clicksToday}
        </div>
      </div>
    </div>
  );
}

const THEME_SWATCHES = [
  ["#16120f", "#ee4f2b"],
  ["#0b0b10", "#32e0e0"],
  ["#1c1238", "#a78bfa"],
  ["#fbf8f3", "#16120f"],
  ["#3b1410", "#fb923c"],
  ["#0e2a24", "#34d399"],
];

function ThemesVisual({ copy }: { copy: SiteCopy }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {THEME_SWATCHES.map(([bg, accent], i) => (
        <div key={bg} className="rounded-2xl bg-white p-2 ring-1 ring-line">
          <div className="rounded-xl p-3" style={{ backgroundColor: bg }}>
            <div className="mx-auto h-6 w-6 rounded-full" style={{ backgroundColor: accent }} />
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 rounded-full opacity-90" style={{ backgroundColor: accent }} />
              <div className="h-2.5 rounded-full opacity-40" style={{ backgroundColor: accent }} />
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] font-medium text-ink-muted">{copy.demoCards.themes[i]}</p>
        </div>
      ))}
    </div>
  );
}

function CampaignVisual({ copy }: { copy: SiteCopy }) {
  const rows = [copy.demoCards.allPosts, copy.demoCards.typo, copy.demoCards.endsOn];
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-muted">{copy.demoCards.keywordLabel}</p>
      <span className="mt-2 inline-block rounded-lg bg-coral px-3 py-1.5 font-heading text-lg font-bold text-white">{copy.demoCards.keyword}</span>
      <ul className="mt-5 space-y-2.5">
        {rows.map((row) => (
          <li key={row} className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 text-sm text-ink">
            {row}
            <span className="relative h-5 w-9 rounded-full bg-moss">
              <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-2xl rounded-bl-md bg-ink p-4 text-sm text-paper">
        {copy.demo.dmGreeting} <span className="font-semibold text-[#ffb59f]">{copy.demo.dmLink}</span>
      </div>
    </div>
  );
}

function MetricsVisual({ copy }: { copy: SiteCopy }) {
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
      <p className="font-heading text-lg font-semibold text-ink">{copy.demoCards.sourcesTitle}</p>
      <ul className="mt-5 space-y-4">
        {copy.demoCards.sources.map((source) => (
          <li key={source.label}>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">{source.label}</span>
              <span className="font-semibold text-ink">{source.value}%</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-paper-2">
              <div className="h-2.5 rounded-full bg-coral" style={{ width: `${source.value}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SchedulerVisual({ copy }: { copy: SiteCopy }) {
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
      <div className="grid grid-cols-7 gap-2 text-center">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={`grid aspect-square place-items-center rounded-lg text-xs ${
              i === 4 ? "bg-coral font-semibold text-white" : i === 9 ? "bg-coral-soft text-coral-dark" : "bg-paper text-ink-soft"
            }`}
          >
            {i + 14}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-paper p-3">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-[linear-gradient(135deg,#f7a35c,#ee4f2b)]" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{copy.demoCards.scheduled}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-moss">
            <Check className="h-3 w-3" /> {copy.demoCards.autoReply}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function Home({ params, searchParams }: Props) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const copy = getSiteCopy(locale);
  const signup = `/${locale}/login`;
  const beta = (searchParams ? await searchParams : {}).beta;
  const featureVisuals = [ThemesVisual, CampaignVisual, MetricsVisual, SchedulerVisual];

  return (
    <div className={`${siteFontVariables} min-h-screen overflow-x-clip bg-paper font-site text-ink selection:bg-coral selection:text-white`}>
      <SiteHeader locale={locale} onHome />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              {copy.hero.badge}
            </p>
            <h1 className="mt-7 text-balance font-heading text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              {copy.hero.titleStart}{" "}
              <span className="relative whitespace-nowrap text-coral">
                {copy.hero.titleHighlight}
                <svg aria-hidden="true" viewBox="0 0 300 18" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-coral/35">
                  <path d="M3 13c60-9 140-12 294-6" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>{" "}
              {copy.hero.titleEnd}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-ink-soft">{copy.hero.description}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={signup}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-7 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(238,79,43,.7)] transition hover:bg-coral-dark"
              >
                {copy.hero.primary} <Arrow />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white px-7 py-4 text-base font-semibold text-ink transition hover:border-ink/40"
              >
                {copy.hero.secondary}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              {copy.hero.reassurance.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-moss" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual copy={copy} />
        </section>

        {/* Trust strip */}
        <section className="border-y border-line bg-white">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-3 px-5 py-6 text-sm font-medium text-ink-soft sm:px-8 lg:grid-cols-4">
            {copy.trust.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-coral-soft text-coral-dark">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="max-w-2xl">
            <Eyebrow>{copy.how.eyebrow}</Eyebrow>
            <SectionTitle>{copy.how.title}</SectionTitle>
          </div>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {copy.how.steps.map((step, i) => (
              <li key={step.title} className="rounded-3xl bg-white p-7 ring-1 ring-line">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-heading text-lg font-bold text-paper">{i + 1}</span>
                <h3 className="mt-6 font-heading text-2xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 leading-7 text-ink-soft">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section id="recursos" className="scroll-mt-20 border-t border-line bg-paper-2 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <Eyebrow>{copy.features.eyebrow}</Eyebrow>
              <SectionTitle>{copy.features.title}</SectionTitle>
            </div>
            <div className="mt-16 space-y-20 lg:space-y-28">
              {copy.features.items.map((feature, i) => {
                const Visual = featureVisuals[i];
                return (
                  <div key={feature.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                      <p className="text-sm font-semibold text-coral-dark">{feature.eyebrow}</p>
                      <h3 className="mt-3 text-balance font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{feature.title}</h3>
                      <p className="mt-4 text-lg leading-8 text-ink-soft">{feature.description}</p>
                      <ul className="mt-6 space-y-3">
                        {feature.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-ink-soft">
                            <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-paper">
                              <Check className="h-3 w-3" />
                            </span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                      <Visual copy={copy} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
          <div className="max-w-2xl">
            <Eyebrow>{copy.useCases.eyebrow}</Eyebrow>
            <SectionTitle>{copy.useCases.title}</SectionTitle>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.useCases.items.map((item) => (
              <article key={item.title} className="rounded-3xl border border-line p-6 transition hover:border-ink/30 hover:bg-white">
                <h3 className="font-heading text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="precos" className="scroll-mt-20 bg-ink py-24 text-paper lg:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#ffb59f]">{copy.pricing.eyebrow}</p>
              <SectionTitle className="text-paper">{copy.pricing.title}</SectionTitle>
              <p className="mt-5 text-lg text-paper/65">{copy.pricing.description}</p>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {copy.pricing.tiers.map((tier) => {
                const featured = Boolean(tier.highlight);
                return (
                  <article
                    key={tier.name}
                    className={`relative flex flex-col rounded-3xl p-7 ${featured ? "bg-paper text-ink" : "bg-white/[.06] ring-1 ring-white/10"}`}
                  >
                    {tier.highlight && (
                      <span className="absolute right-6 top-6 rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white">{tier.highlight}</span>
                    )}
                    <p className={`font-heading text-xl font-semibold ${featured ? "" : "text-paper"}`}>{tier.name}</p>
                    <p className="mt-5 flex items-baseline gap-2">
                      <span className="font-heading text-5xl font-bold tracking-tight">{tier.price}</span>
                      <span className={`text-sm ${featured ? "text-ink-muted" : "text-paper/55"}`}>{tier.period}</span>
                    </p>
                    <p className={`mt-4 text-sm leading-6 ${featured ? "text-ink-soft" : "text-paper/65"}`}>{tier.description}</p>
                    <ul className={`mt-6 flex-1 space-y-3 border-t pt-6 text-sm ${featured ? "border-line" : "border-white/10 text-paper/85"}`}>
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex gap-2.5">
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-coral" : "text-[#ffb59f]"}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={signup}
                      className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                        featured ? "bg-coral text-white hover:bg-coral-dark" : "bg-paper text-ink hover:bg-white"
                      }`}
                    >
                      {tier.cta} <Arrow />
                    </Link>
                  </article>
                );
              })}
            </div>
            <p className="mt-8 text-center text-sm text-paper/50">{copy.pricing.note}</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="text-center">
            <Eyebrow>{copy.faq.eyebrow}</Eyebrow>
            <SectionTitle>{copy.faq.title}</SectionTitle>
          </div>
          <div className="mt-12 divide-y divide-line border-y border-line">
            {copy.faq.items.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink-muted transition group-open:rotate-45">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 pr-12 leading-7 text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA + agencies */}
        <section id="contato" className="scroll-mt-20 px-5 pb-24 sm:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="relative overflow-hidden rounded-[2rem] bg-coral p-10 text-white sm:p-14">
              <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
              <h2 className="relative max-w-lg text-balance font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{copy.final.title}</h2>
              <p className="relative mt-5 max-w-md text-lg text-white/85">{copy.final.description}</p>
              <Link
                href={signup}
                className="relative mt-9 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-base font-semibold text-paper transition hover:bg-black"
              >
                {copy.final.cta} <Arrow />
              </Link>
            </div>
            <div className="rounded-[2rem] bg-white p-8 ring-1 ring-line sm:p-10">
              <h3 className="font-heading text-2xl font-bold tracking-tight">{copy.final.agencyTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{copy.final.agencyDescription}</p>
              {beta === "success" ? (
                <p className="mt-6 rounded-2xl bg-coral-soft p-4 text-sm font-medium text-coral-dark">{copy.final.success}</p>
              ) : (
                <form action={submitWaitlist} className="mt-6 space-y-3">
                  <input type="hidden" name="locale" value={locale} />
                  {beta === "invalid" && <p className="text-sm font-medium text-coral-dark">{copy.final.invalid}</p>}
                  {[
                    { name: "name", label: copy.final.name, type: "text", required: true, autoComplete: "name" },
                    { name: "email", label: copy.final.email, type: "email", required: true, autoComplete: "email" },
                    { name: "company", label: copy.final.company, type: "text", required: false, autoComplete: "organization" },
                  ].map((field) => (
                    <label key={field.name} className="block">
                      <span className="sr-only">{field.label}</span>
                      <input
                        name={field.name}
                        type={field.type}
                        required={field.required}
                        autoComplete={field.autoComplete}
                        placeholder={field.label}
                        className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-coral"
                      />
                    </label>
                  ))}
                  <button type="submit" className="w-full rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-paper transition hover:bg-coral-dark">
                    {copy.final.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} onHome />
    </div>
  );
}
