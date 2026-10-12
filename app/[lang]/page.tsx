import type { Metadata } from "next";
import Link from "next/link";
import { landingTranslator } from "@/lib/i18n/landing";
import { redirect } from "next/navigation";
import PublicSiteHeader from "@/components/public-site-header";
import LanguageSwitcher from "@/components/language-switcher";
import { getDictionary, hasLocale, defaultLocale, type Locale } from "./dictionaries";
import { betaWaitlistSchema, normalizeBetaWaitlistEntry } from "@/lib/beta/waitlist";
import { saveBetaWaitlistEntry } from "@/lib/beta/storage";
import { sendBetaWelcomeEmail } from "@/lib/beta/email";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    title: `${dict.common.brandName} - ${dict.landing.heroTitle}`,
    description: dict.landing.heroDescription,
  };
}

async function submitWaitlist(formData: FormData) {
  "use server";

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    company: String(formData.get("company") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    source: "landing-page",
  };

  const parsed = betaWaitlistSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/?beta=invalid");
  }

  const entry = normalizeBetaWaitlistEntry(parsed.data);
  await saveBetaWaitlistEntry(entry);
  await sendBetaWelcomeEmail({
    name: entry.name,
    email: entry.email,
    company: entry.company,
    goal: entry.goal,
  });
  redirect("/?beta=success");
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
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
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.091-3.091L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.091-3.091L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.091 3.091L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.091 3.091ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}

function InstagramPost({ locale }: { locale: Locale }) {
  const t = landingTranslator(locale);
  return (
    <div className="border border-white/10 bg-zinc-950 p-3 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-300" />
          <div>
            <p className="text-sm font-semibold text-white">@studio.store</p>
            <p className="text-xs text-zinc-500">{t("Reel campaign")}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">
          {t("Live")}
        </span>
      </div>

      <div className="mt-3 aspect-[4/5] overflow-hidden bg-[linear-gradient(135deg,#f97316_0%,#ec4899_48%,#22d3ee_100%)] p-4">
        <div className="flex h-full flex-col justify-between border border-white/20 bg-black/20 p-4">
          <p className="text-xs font-semibold text-white/80">{t("New drop")}</p>
          <div>
            <p className="text-2xl font-bold leading-tight text-white">
              {t("Comment LINK")}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {t("Get the full guide in your inbox.")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-semibold text-white">@maya.co</p>
          <p className="mt-1 text-sm text-zinc-300">{t("LINK please")}</p>
        </div>
        <div className="border border-emerald-300/20 bg-emerald-300/10 p-3">
          <p className="text-xs font-semibold text-emerald-100">{t("Matched keyword")}</p>
          <p className="mt-1 text-sm text-zinc-200">{t("Queued private reply")}</p>
        </div>
      </div>
    </div>
  );
}

function BuilderPreview({ locale }: { locale: Locale }) {
  const t = landingTranslator(locale);
  return (
    <div className="border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">{t("Product guide reply")}</p>
          <p className="text-xs text-zinc-500">{t("Campaign builder")}</p>
        </div>
        <span className="bg-cyan-300 px-3 py-1 text-xs font-bold text-zinc-950">
          {t("Active")}
        </span>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <div className="border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-zinc-500">{t("POST OR REEL")}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-14 w-14 bg-[linear-gradient(135deg,#f43f5e,#22d3ee)]" />
              <div>
                <p className="text-sm font-semibold text-white">{t("Spring drop reel")}</p>
                <p className="text-xs text-zinc-500">{t("12.8k views")}</p>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-zinc-500">{t("KEYWORDS")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["LINK", "GUIDE", "PRICE"].map((item) => (
                <span
                  key={item}
                  className="border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-zinc-500">{t("PRIVATE REPLY")}</p>
          <div className="mt-4 flex-1 border border-white/10 bg-zinc-950 p-4 text-sm leading-6 text-zinc-200">
            {t("Hey {username}, here is the product guide you asked for:")}
            <span className="text-cyan-200"> shop.link/guide</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["1", "job"],
              ["0", "dupes"],
              ["sent", "status"],
            ].map(([value, label]) => (
              <div key={label} className="border border-white/10 bg-zinc-950 p-2">
                <p className="text-sm font-bold text-white">{t(value)}</p>
                <p className="text-[11px] text-zinc-500">{t(label)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardVisual({ locale }: { locale: Locale }) {
  const t = landingTranslator(locale);
  return (
    <div className="border border-white/10 bg-zinc-950 p-4 shadow-2xl shadow-black/40">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Active campaigns", "8"],
          ["DMs this month", new Intl.NumberFormat(locale).format(1284)],
          ["Delivery status", "99%"],
        ].map(([label, value]) => (
          <div key={label} className="border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-zinc-500">{t(label)}</p>
            <p className="mt-2 text-2xl font-bold text-white">{t(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">{t("Recent replies")}</p>
          <p className="text-xs text-zinc-500">{t("Live logs")}</p>
        </div>
        <div className="mt-4 space-y-2">
          {[
            ["@maya.co", "Product guide reply", "Sent"],
            ["@founder.ray", "Price request", "Sent"],
            ["@shop.ava", "Lead magnet", "Queued"],
          ].map(([user, automation, status]) => (
            <div
              key={`${user}-${automation}`}
              className="grid grid-cols-[1fr_1.1fr_auto] items-center gap-3 border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
            >
              <span className="truncate text-white">{user}</span>
              <span className="truncate text-zinc-400">{t(automation)}</span>
              <span className="bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-100">
                {t(status)}
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
  const prefix = `/${locale}`;
  const t = landingTranslator(locale);
  const betaParams = searchParams ? await searchParams : {};
  const betaSuccess = betaParams.beta === "success";
  const betaInvalid = betaParams.beta === "invalid";

  const heroStats = [
    { value: "24/7", label: dict.landing.stats.monitoring },
    { value: "1", label: dict.landing.stats.dmPerComment },
    { value: "0", label: dict.landing.stats.scraping },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[linear-gradient(115deg,rgba(34,211,238,0.16),rgba(16,185,129,0.08)_42%,rgba(244,63,94,0.10)_70%,rgba(9,9,11,0)_100%)]" />

      <PublicSiteHeader
        active="home"
        locale={locale}
        dict={dict.common}
      />

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-16 pt-12 sm:px-6 sm:pt-18 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100">
            <SparkIcon />
            {dict.landing.badge}
          </div>

          <h1 className="mt-7 text-balance text-5xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {dict.landing.heroTitle}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            {dict.landing.heroDescription}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${prefix}/login`}
              className="inline-flex items-center justify-center gap-2 bg-cyan-300 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-200"
            >
              {dict.common.startFree}
              <ArrowIcon />
            </Link>
            <a
              href="#product"
              className="inline-flex items-center justify-center border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              {dict.common.seeWorkflow}
            </a>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="border border-white/10 bg-white/[0.035] p-4">
                <dt className="text-2xl font-black text-white">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-5 text-zinc-500">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-8 hidden h-20 w-20 border border-cyan-200/20 bg-cyan-300/10 lg:block" />
          <div className="absolute -right-4 bottom-10 hidden h-24 w-24 border border-rose-200/20 bg-rose-300/10 lg:block" />
          <div className="relative grid gap-4 sm:grid-cols-[0.74fr_1fr]">
            <InstagramPost locale={locale} />
            <div className="space-y-4 sm:pt-16">
              <BuilderPreview locale={locale} />
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">{t("Plan guard")}</p>
                  <p className="mt-2 text-lg font-bold text-white">{t("2,000/mo")}</p>
                </div>
                <div className="border border-white/10 bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">{t("Worker")}</p>
                  <p className="mt-2 text-lg font-bold text-white">{t("Running")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="border-y border-white/10 bg-zinc-950/55 py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-zinc-400">
            {dict.landing.audiences.title}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {dict.landing.audiences.items.map((audience: string) => (
              <div
                key={audience}
                className="border border-white/10 bg-white/[0.03] px-3 py-3 text-center text-sm font-semibold text-zinc-300"
              >
                {audience}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Workflow */}
      <section id="product" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-cyan-200">
              {dict.landing.workflow.eyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
              {dict.landing.workflow.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              {dict.landing.workflow.description}
            </p>
          </div>

          <div className="grid gap-4">
            {dict.landing.workflow.steps.map((step: { eyebrow: string; title: string; description: string }) => (
              <article
                key={step.title}
                className="grid gap-4 border border-white/10 bg-white/[0.035] p-5 sm:grid-cols-[140px_1fr]"
              >
                <p className="text-sm font-bold text-emerald-200">{step.eyebrow}</p>
                <div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="border-y border-white/10 bg-white/[0.025] py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:items-center">
          <DashboardVisual locale={locale} />

          <div>
            <p className="text-sm font-bold uppercase text-emerald-200">
              {dict.landing.dashboard.eyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
              {dict.landing.dashboard.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              {dict.landing.dashboard.description}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dict.landing.platformFeatures.slice(0, 4).map((feature: string) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="text-emerald-200">
                    <CheckIcon />
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase text-cyan-200">
            {dict.landing.useCases.eyebrow}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
            {dict.landing.useCases.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dict.landing.useCases.cards.map((card: { title: string; description: string }) => (
            <article key={card.title} className="border border-white/10 bg-zinc-950 p-5">
              <div className="mb-6 flex h-10 w-10 items-center justify-center border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
                <SparkIcon />
              </div>
              <h3 className="text-xl font-bold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-y border-white/10 bg-zinc-950/60 py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-200">
              {dict.landing.trust.eyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
              {dict.landing.trust.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              {dict.landing.trust.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {dict.landing.platformFeatures.map((feature: string) => (
              <div
                key={feature}
                className="flex items-center gap-3 border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-zinc-200"
              >
                <span className="text-emerald-200">
                  <CheckIcon />
                </span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase text-cyan-200">
            {dict.landing.pricing.eyebrow}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
            {dict.landing.pricing.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-zinc-400">
            {dict.landing.pricing.description}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {dict.landing.pricing.tiers.map((tier: { name: string; price: string; label: string; description: string; features: string[]; cta: string }, index: number) => {
            const isFeatured = index === 1;
            return (
              <article
                key={tier.name}
                className={`border p-6 ${
                  isFeatured
                    ? "border-cyan-200/40 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.035]"
                }`}
              >
                <div className="flex min-h-24 items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-white">{tier.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{tier.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold ${
                      isFeatured
                        ? "bg-cyan-300 text-zinc-950"
                        : "border border-white/10 text-zinc-400"
                    }`}
                  >
                    {tier.label}
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-1">
                  <span className="text-5xl font-black text-white">{tier.price}</span>
                  <span className="pb-2 text-sm text-zinc-500">{t("/mo")}</span>
                </div>

                <ul className="mt-7 space-y-3">
                  {tier.features.map((feature: string) => (
                    <li key={feature} className="flex gap-3 text-sm text-zinc-300">
                      <span className="mt-0.5 text-emerald-200">
                        <CheckIcon />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`${prefix}/login`}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition ${
                    isFeatured
                      ? "bg-cyan-300 text-zinc-950 hover:bg-cyan-200"
                      : "border border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  {tier.cta}
                  <ArrowIcon />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* Founding Offer */}
      <section
        id="founding-offer"
        className="border-y border-white/10 bg-zinc-950/70 py-20"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase text-rose-200">
              {dict.landing.founding.eyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
              {dict.landing.founding.title}
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              {dict.landing.founding.description}
            </p>
            <Link
              href={`${prefix}/login`}
              className="mt-8 inline-flex items-center justify-center gap-2 bg-rose-200 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-rose-100"
            >
              {dict.landing.founding.cta}
              <ArrowIcon />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="border border-rose-200/20 bg-rose-300/10 p-6">
              <h3 className="text-2xl font-black text-white">
                {dict.landing.founding.whatFoundersGet}
              </h3>
              <ul className="mt-6 space-y-3">
                {dict.landing.founding.items.map((item: string) => (
                  <li key={item} className="flex gap-3 text-sm text-zinc-300">
                    <span className="mt-0.5 text-rose-200">
                      <CheckIcon />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="border border-white/10 bg-white/[0.035] p-6">
              <h3 className="text-2xl font-black text-white">
                {dict.landing.founding.referralLoop}
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {dict.landing.founding.referralDescription}
              </p>
              <ol className="mt-6 space-y-3">
                {dict.landing.founding.referralSteps.map((item: string, index: number) => (
                  <li key={item} className="flex gap-3 text-sm text-zinc-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-cyan-200/20 text-xs font-black text-cyan-100">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-white/10 bg-white/[0.025] py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-200">
                {dict.landing.faq.eyebrow}
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-white">
                {dict.landing.faq.title}
              </h2>
            </div>
            <div className="grid gap-3">
              {dict.landing.faq.items.map((faq: { question: string; answer: string }) => (
                <article key={faq.question} className="border border-white/10 bg-zinc-950 p-5">
                  <h3 className="text-lg font-bold text-white">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Beta waitlist */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(16,185,129,0.06),rgba(244,63,94,0.08))] p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase text-cyan-100">{t("Beta access")}</p>
            <h2 className="mt-3 max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl">
              {t("Request early access for agencies and launch teams.")}
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              {t("Join the initial cohort for onboarding, feedback, and the founding agency offer.")}
            </p>
            {betaSuccess && (
              <div className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                {t("You are on the beta waitlist. We will reach out with the next onboarding step.")}
              </div>
            )}
            {betaInvalid && (
              <div className="mt-5 rounded-xl border border-rose-300/30 bg-rose-400/10 p-4 text-sm text-rose-100">
                {t("Please provide a valid name and work email.")}
              </div>
            )}
          </div>

          <form action={submitWaitlist} className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">
                <span>{t("Name")}</span>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-300"
                  placeholder="Ana Silva"
                />
              </label>
              <label className="space-y-2 text-sm text-zinc-300">
                <span>{t("Work email")}</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-300"
                  placeholder={t("you@agency.com")}
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span>{t("Company")}</span>
              <input
                name="company"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-300"
                placeholder="Studio North"
              />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span>{t("What are you trying to launch?")}</span>
              <textarea
                name="goal"
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-300"
                placeholder={t("3 client campaigns, lead magnet flow, or weekly launch funnel...")}
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 bg-cyan-300 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-cyan-200"
            >
              {t("Join beta waitlist")}
              <ArrowIcon />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(16,185,129,0.08),rgba(244,63,94,0.06))] p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-cyan-100">
              {dict.landing.finalCta.eyebrow}
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              {dict.landing.finalCta.title}
            </h2>
          </div>
          <Link
            href={`${prefix}/login`}
            className="inline-flex items-center justify-center gap-2 bg-cyan-300 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-cyan-200"
          >
            {dict.common.startFree}
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 text-sm text-zinc-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-cyan-200/20 bg-cyan-300/10 text-xs font-black text-cyan-100">
              MP
            </span>
            <span>MeuPerfil</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`${prefix}/templates`} className="transition hover:text-white">
              {dict.common.templates}
            </Link>
            <Link href={`${prefix}/manychat-alternative`} className="transition hover:text-white">
              {t("Manychat alternative")}
            </Link>
            <Link href={`${prefix}/instagram-comment-to-dm-templates`} className="transition hover:text-white">
              {dict.common.commentToDmTemplates}
            </Link>
            <Link href={`${prefix}/instagram-dm-automation-agencies`} className="transition hover:text-white">
              {dict.common.agencies}
            </Link>
            <Link href={`${prefix}/comment-link-automation`} className="transition hover:text-white">
              {dict.common.commentLinkAutomation}
            </Link>
            <Link href={`${prefix}/login`} className="transition hover:text-white">
              {dict.common.signIn}
            </Link>
            <Link href={`${prefix}/privacy`} className="transition hover:text-white">
              {dict.common.privacy}
            </Link>
            <Link href={`${prefix}/terms`} className="transition hover:text-white">
              {dict.common.terms}
            </Link>
            <Link href={`${prefix}/data-deletion`} className="transition hover:text-white">
              {dict.common.dataDeletion}
            </Link>
            <Link href={`${prefix}/meta-review`} className="transition hover:text-white">
              {dict.common.metaReview}
            </Link>
            <LanguageSwitcher currentLocale={locale} variant="compact" />
          </div>
        </div>
      </footer>
    </main>
  );
}
