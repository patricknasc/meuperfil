import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PublicSiteHeader from "@/components/public-site-header";
import LanguageSwitcher from "@/components/language-switcher";
import { landingTranslator } from "@/lib/i18n/landing";
import {
  betaWaitlistSchema,
  normalizeBetaWaitlistEntry,
} from "@/lib/beta/waitlist";
import { saveBetaWaitlistEntry } from "@/lib/beta/storage";
import { sendBetaWelcomeEmail } from "@/lib/beta/email";
import {
  getDictionary,
  hasLocale,
  defaultLocale,
  type Locale,
} from "./dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.common.brandName} — ${dict.landing.heroTitle}`,
    description: dict.landing.heroDescription,
  };
}

async function submitWaitlist(formData: FormData) {
  "use server";
  const localeValue = String(formData.get("locale") ?? defaultLocale);
  const locale = hasLocale(localeValue) ? localeValue : defaultLocale;
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    company: String(formData.get("company") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    source: "landing-page",
  };
  const parsed = betaWaitlistSchema.safeParse(raw);
  if (!parsed.success) redirect(`/${locale}?beta=invalid#early-access`);
  const entry = normalizeBetaWaitlistEntry(parsed.data);
  await saveBetaWaitlistEntry(entry);
  await sendBetaWelcomeEmail({
    name: entry.name,
    email: entry.email,
    company: entry.company,
    goal: entry.goal,
  });
  redirect(`/${locale}?beta=success#early-access`);
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14m-6-6 6 6-6 6"
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12 4.2 4.2L19.5 6"
      />
    </svg>
  );
}
function FlowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3v4m0 10v4M3 7h4m10 0h4M17 17h4m-4 0v4M7 17H3m4 0v4M12 7.5A4.5 4.5 0 1 0 12 16.5 4.5 4.5 0 0 0 12 7.5Z"
      />
    </svg>
  );
}

function CommentToDmCanvas({ locale }: { locale: Locale }) {
  const t = landingTranslator(locale);
  return (
    <div className="relative mx-auto w-full max-w-[590px] text-left">
      <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_20%_20%,rgba(245,112,89,.34),transparent_36%),radial-gradient(circle_at_78%_62%,rgba(113,130,255,.25),transparent_42%)] blur-2xl" />
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#151617] shadow-[0_32px_90px_rgba(0,0,0,.48)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[conic-gradient(from_210deg,#f5bd6a,#ef5d87,#784eeb,#f5bd6a)] p-[2px]">
              <div className="h-full w-full rounded-full bg-[#1b1c1e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">studio.maré</p>
              <p className="text-xs text-white/45">
                Instagram · {t("Reel campaign")}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#b9f7df] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#123f31]">
            {t("Live")}
          </span>
        </div>
        <div className="grid gap-0 md:grid-cols-[.96fr_1.04fr]">
          <div className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
            <div className="relative aspect-[4/4.55] overflow-hidden rounded-xl bg-[linear-gradient(145deg,#f6b866_0%,#ed7c72_47%,#7955dd_100%)] p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_22%,rgba(255,255,255,.45),transparent_16%),radial-gradient(circle_at_28%_70%,rgba(33,20,66,.33),transparent_35%)]" />
              <div className="relative flex h-full flex-col justify-between rounded-lg border border-white/30 bg-[#18151d]/15 p-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/75">
                  {t("New drop")}
                </span>
                <div>
                  <p className="max-w-[11rem] text-3xl font-black leading-[.91] tracking-[-.075em]">
                    {t("Comment LINK")}
                  </p>
                  <p className="mt-3 max-w-[12rem] text-sm leading-5 text-white/85">
                    {t("Get the full guide in your inbox.")}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[#d8d8d8]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">maya.co</p>
                <p className="mt-0.5 text-sm text-white/70">
                  {t("LINK please")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">
              {t("Campaign builder")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ffdbb8] text-xs font-black text-[#6a3a16]">
                01
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {t("Matched keyword")}
                </p>
                <p className="text-xs text-white/45">LINK</p>
              </div>
            </div>
            <div className="my-2 ml-4 h-5 border-l border-dashed border-white/20" />
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c4ccff] text-xs font-black text-[#303a81]">
                02
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {t("Private reply")}
                </p>
                <p className="text-xs text-white/45">
                  {t("Queued private reply")}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[.045] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
                Instagram Direct
              </p>
              <div className="mt-3 rounded-lg rounded-tl-sm bg-[#31343a] px-3 py-2.5 text-sm leading-5 text-white/90">
                {t("Hey {username}, here is the product guide you asked for:")}{" "}
                <span className="font-medium text-[#c4ccff]">
                  shop.link/guide
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#b9f7df]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b9f7df]" />{" "}
                {t("Sent")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationsCanvas({ locale }: { locale: Locale }) {
  const t = landingTranslator(locale);
  const events = [
    [
      "@maya.co",
      t("Product guide reply"),
      t("Sent"),
      "bg-[#b9f7df] text-[#123f31]",
    ],
    [
      "@founder.ray",
      t("Price request"),
      t("Sent"),
      "bg-[#b9f7df] text-[#123f31]",
    ],
    ["@shop.ava", t("Lead magnet"), t("Queued"), "bg-[#c4ccff] text-[#303a81]"],
  ];
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#1d2028] bg-[#111214] shadow-[0_24px_70px_rgba(0,0,0,.35)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">MeuPerfil</p>
          <p className="mt-0.5 text-xs text-white/45">{t("Live logs")}</p>
        </div>
        <span className="flex items-center gap-2 text-xs font-medium text-[#b9f7df]">
          <span className="h-2 w-2 rounded-full bg-[#b9f7df]" /> {t("Live")}
        </span>
      </div>
      <div className="grid gap-px bg-white/10 sm:grid-cols-3">
        {[
          [t("Active campaigns"), "08"],
          [t("DMs this month"), "1.284"],
          [t("Delivery status"), "99%"],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#111214] p-5">
            <p className="text-xs text-white/45">{label}</p>
            <p className="mt-3 text-3xl font-black tracking-[-.06em] text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-sm font-medium text-white">
            {t("Recent replies")}
          </p>
          <p className="text-xs text-white/40">{t("Delivery status")}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          {events.map(([account, campaign, status, color]) => (
            <div
              key={account}
              className="grid grid-cols-[.82fr_1fr_auto] items-center gap-3 border-b border-white/10 px-3.5 py-3 last:border-b-0"
            >
              <p className="truncate text-sm font-medium text-white">
                {account}
              </p>
              <p className="truncate text-xs text-white/50">{campaign}</p>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold ${color}`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ beta?: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const t = landingTranslator(locale);
  const prefix = `/${locale}`;
  const betaParams = searchParams ? await searchParams : {};
  const betaSuccess = betaParams.beta === "success";
  const betaInvalid = betaParams.beta === "invalid";
  return (
    <main className="min-h-screen overflow-hidden bg-[#101112] text-[#f7f5ef] selection:bg-[#ffcf9b] selection:text-[#20160e]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(ellipse_at_20%_0%,rgba(244,112,89,.13),transparent_45%),radial-gradient(ellipse_at_74%_18%,rgba(113,130,255,.14),transparent_38%)]" />
      <PublicSiteHeader
        active="home"
        locale={locale}
        dict={dict.common}
        ctaHref="#early-access"
        ctaLabel={t("Join beta waitlist")}
      />
      <section className="relative mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffcf9b]/25 bg-[#ffcf9b]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#ffe1bf]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffb46c]" />
            {dict.landing.badge}
          </div>
          <h1 className="mt-7 text-balance text-5xl font-black leading-[.93] tracking-[-.075em] text-[#f7f5ef] sm:text-6xl lg:text-7xl">
            {dict.landing.heroTitle}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/60 sm:text-xl">
            {dict.landing.heroDescription}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#early-access"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffcf9b] px-6 py-3.5 text-sm font-bold text-[#20160e] transition hover:bg-[#ffe0bd]"
            >
              {t("Join beta waitlist")} <ArrowIcon />
            </a>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white/85 transition hover:border-white/35 hover:bg-white/[.04]"
            >
              {dict.common.seeWorkflow}
            </a>
          </div>
          <div className="mt-11 grid grid-cols-3 gap-5 border-t border-white/10 pt-6">
            {[
              ["01", t("Comment trigger")],
              ["02", t("Keywords")],
              ["03", t("Private reply")],
            ].map(([number, label]) => (
              <div key={number}>
                <p className="text-sm font-bold text-[#ffcf9b]">{number}</p>
                <p className="mt-1.5 text-xs leading-5 text-white/45">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <CommentToDmCanvas locale={locale} />
      </section>
      <section className="border-y border-white/10 bg-white/[.025]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p className="max-w-sm text-sm font-medium leading-6 text-white/55">
            {dict.landing.audiences.title}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/65">
            {dict.landing.audiences.items
              .slice(0, 5)
              .map((audience: string) => (
                <span key={audience}>{audience}</span>
              ))}
          </div>
        </div>
      </section>
      <section
        id="workflow"
        className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffcf9b]">
            {dict.landing.workflow.eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-4xl font-black leading-[.98] tracking-[-.06em] text-white sm:text-5xl">
            {dict.landing.workflow.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/55">
            {dict.landing.workflow.description}
          </p>
        </div>
        <div className="mt-14 grid overflow-hidden rounded-[1.5rem] border border-white/10 lg:grid-cols-3">
          {dict.landing.workflow.steps.map(
            (
              step: { eyebrow: string; title: string; description: string },
              index: number,
            ) => (
              <article
                key={step.title}
                className="relative min-h-[270px] border-b border-white/10 p-7 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <span className="text-xs font-black tracking-[.16em] text-[#ffcf9b]">
                  0{index + 1}
                </span>
                <div className="mt-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 text-[#c4ccff]">
                  <FlowIcon />
                </div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-white/40">
                  {step.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-[-.035em] text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  {step.description}
                </p>
              </article>
            ),
          )}
        </div>
      </section>
      <section className="border-y border-white/10 bg-[#161718] py-24 lg:py-32">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_.85fr] lg:items-center lg:px-10">
          <OperationsCanvas locale={locale} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#c4ccff]">
              {dict.landing.dashboard.eyebrow}
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-[.98] tracking-[-.06em] text-white sm:text-5xl">
              {dict.landing.dashboard.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/55">
              {dict.landing.dashboard.description}
            </p>
            <ul className="mt-8 space-y-3">
              {dict.landing.platformFeatures
                .slice(0, 4)
                .map((feature: string) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-white/75"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#c4ccff] text-[#303a81]">
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>
      <section
        id="use-cases"
        className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffcf9b]">
              {dict.landing.useCases.eyebrow}
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-[.98] tracking-[-.06em] text-white sm:text-5xl">
              {dict.landing.useCases.title}
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-white/45">
            {t("Social commerce")} · {t("Lead generation")} ·{" "}
            {t("Creator funnels")}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dict.landing.useCases.cards.map(
            (card: { title: string; description: string }, index: number) => (
              <article
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/[.025] p-6 transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[.05]"
              >
                <p className="text-xs font-black tracking-[.16em] text-[#ffcf9b]">
                  0{index + 1}
                </p>
                <h3 className="mt-12 text-xl font-bold tracking-[-.03em] text-white">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  {card.description}
                </p>
              </article>
            ),
          )}
        </div>
      </section>
      <section
        id="pricing"
        className="border-y border-white/10 bg-[#161718] py-24 lg:py-32"
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffcf9b]">
              {dict.landing.pricing.eyebrow}
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-[.98] tracking-[-.06em] text-white sm:text-5xl">
              {dict.landing.pricing.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/55">
              {dict.landing.pricing.description}
            </p>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {dict.landing.pricing.tiers.map(
              (
                tier: {
                  name: string;
                  price: string;
                  label: string;
                  description: string;
                  features: string[];
                  cta: string;
                },
                index: number,
              ) => {
                const featured = index === 1;
                return (
                  <article
                    key={tier.name}
                    className={`relative rounded-2xl border p-7 ${featured ? "border-[#ffcf9b]/60 bg-[#ffcf9b] text-[#20160e] shadow-[0_18px_50px_rgba(255,177,105,.16)]" : "border-white/10 bg-[#101112] text-white"}`}
                  >
                    {featured && (
                      <span className="absolute right-5 top-5 rounded-full bg-[#20160e] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ffcf9b]">
                        {tier.label}
                      </span>
                    )}
                    <p
                      className={`text-sm font-bold ${featured ? "text-[#6a3a16]" : "text-white/55"}`}
                    >
                      {tier.name}
                    </p>
                    <div className="mt-6 flex items-end gap-1">
                      <span className="text-5xl font-black tracking-[-.07em]">
                        {tier.price}
                      </span>
                      <span
                        className={`mb-1 text-sm ${featured ? "text-[#6a3a16]" : "text-white/45"}`}
                      >
                        {t("/mo")}
                      </span>
                    </div>
                    <p
                      className={`mt-5 min-h-12 text-sm leading-6 ${featured ? "text-[#6a3a16]" : "text-white/55"}`}
                    >
                      {tier.description}
                    </p>
                    <ul
                      className={`mt-6 space-y-3 border-t pt-6 text-sm ${featured ? "border-[#20160e]/15 text-[#4d2a12]" : "border-white/10 text-white/70"}`}
                    >
                      {tier.features.map((feature: string) => (
                        <li key={feature} className="flex gap-2.5">
                          <span
                            className={
                              featured ? "text-[#6a3a16]" : "text-[#b9f7df]"
                            }
                          >
                            <CheckIcon />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#early-access"
                      className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${featured ? "bg-[#20160e] text-[#fff4e8] hover:bg-[#322116]" : "border border-white/15 text-white hover:border-white/35 hover:bg-white/[.05]"}`}
                    >
                      {tier.cta}
                      <ArrowIcon />
                    </a>
                  </article>
                );
              },
            )}
          </div>
        </div>
      </section>
      <section
        id="security"
        className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:px-10 lg:py-32"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#c4ccff]">
            {dict.landing.trust.eyebrow}
          </p>
          <h2 className="mt-4 text-balance text-4xl font-black leading-[.98] tracking-[-.06em] text-white sm:text-5xl">
            {dict.landing.trust.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/55">
            {dict.landing.trust.description}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {dict.landing.platformFeatures.map((feature: string) => (
            <div
              key={feature}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4 text-sm font-medium text-white/75"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#c4ccff]/15 text-[#c4ccff]">
                <CheckIcon />
              </span>
              {feature}
            </div>
          ))}
        </div>
      </section>
      <section
        id="early-access"
        className="border-y border-white/10 bg-[radial-gradient(ellipse_at_78%_20%,rgba(244,112,89,.22),transparent_45%),radial-gradient(ellipse_at_18%_80%,rgba(113,130,255,.19),transparent_48%),#161718] py-24 lg:py-32"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.88fr_1.12fr] lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffcf9b]">
              {t("Beta access")}
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-[.98] tracking-[-.06em] text-white sm:text-5xl">
              {t("Request early access for agencies and launch teams.")}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/60">
              {t(
                "Join the initial cohort for onboarding, feedback, and the founding agency offer.",
              )}
            </p>
            <div className="mt-9 border-l border-[#ffcf9b]/60 pl-4 text-sm leading-6 text-white/60">
              {dict.landing.founding.description}
            </div>
            {betaSuccess && (
              <div className="mt-6 rounded-xl border border-[#b9f7df]/30 bg-[#b9f7df]/10 p-4 text-sm text-[#d9ffef]">
                {t(
                  "You are on the beta waitlist. We will reach out with the next onboarding step.",
                )}
              </div>
            )}
            {betaInvalid && (
              <div className="mt-6 rounded-xl border border-red-300/30 bg-red-400/10 p-4 text-sm text-red-100">
                {t("Please provide a valid name and work email.")}
              </div>
            )}
          </div>
          <form
            action={submitWaitlist}
            className="rounded-[1.5rem] border border-white/15 bg-[#101112]/85 p-5 shadow-2xl sm:p-7"
          >
            <input type="hidden" name="locale" value={locale} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-white/70">
                <span>{t("Name")}</span>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffcf9b]/60"
                  placeholder="Ana Silva"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-white/70">
                <span>{t("Work email")}</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffcf9b]/60"
                  placeholder={t("you@agency.com")}
                />
              </label>
            </div>
            <label className="mt-4 block space-y-2 text-sm font-medium text-white/70">
              <span>{t("Company")}</span>
              <input
                name="company"
                className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffcf9b]/60"
                placeholder="Studio North"
              />
            </label>
            <label className="mt-4 block space-y-2 text-sm font-medium text-white/70">
              <span>{t("What are you trying to launch?")}</span>
              <textarea
                name="goal"
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffcf9b]/60"
                placeholder={t(
                  "3 client campaigns, lead magnet flow, or weekly launch funnel...",
                )}
              />
            </label>
            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ffcf9b] px-6 py-3.5 text-sm font-bold text-[#20160e] transition hover:bg-[#ffe0bd]"
            >
              {t("Join beta waitlist")}
              <ArrowIcon />
            </button>
          </form>
        </div>
      </section>
      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-9 text-sm text-white/45 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ffcf9b] text-xs font-black text-[#20160e]">
            MP
          </span>
          <span className="font-semibold text-white/80">meuperfil.me</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href={`${prefix}/templates`}
            className="transition hover:text-white"
          >
            {dict.common.templates}
          </Link>
          <Link
            href={`${prefix}/privacy`}
            className="transition hover:text-white"
          >
            {dict.common.privacy}
          </Link>
          <Link
            href={`${prefix}/terms`}
            className="transition hover:text-white"
          >
            {dict.common.terms}
          </Link>
          <Link
            href={`${prefix}/data-deletion`}
            className="transition hover:text-white"
          >
            {dict.common.dataDeletion}
          </Link>
          <LanguageSwitcher currentLocale={locale} variant="compact" />
        </div>
      </footer>
    </main>
  );
}
