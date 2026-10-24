import { publicTranslator } from "@/lib/i18n/public";
import { campaignTranslator } from "@/lib/i18n/campaigns";
import type { Metadata } from "next";
import Link from "next/link";
import { siteFontVariables } from "@/lib/site/fonts";
import { notFound } from "next/navigation";
import { getCampaignExecutiveSummary } from "@/lib/campaigns/summary";
import { getCampaignReportBySlug } from "@/lib/reports/data";
import { hasLocale, defaultLocale, type Locale } from "../../dictionaries";

type ReportPageProps = {
  params: Promise<{ lang: string; shareSlug: string }>;
};

function formatDate(date: Date | null, locale: string) {
  const t = publicTranslator(locale);
  if (!date) return t("No sends yet");
  return date.toLocaleDateString(locale === "pt" ? "pt-BR" : locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold font-heading tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-soft">{helper}</p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const { lang, shareSlug } = await params;
  const t = publicTranslator(lang);
  const report = await getCampaignReportBySlug(shareSlug, lang);

  if (!report) {
    return {
      title: t("Report Not Found"),
      robots: { index: false, follow: false },
    };
  }

  return {
    title: t("{name} Campaign Report", { name: report.campaign.name }),
    description: t("Read-only Instagram comment-to-DM campaign report for {name}.", { name: report.campaign.name }),
    robots: { index: false, follow: false },
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { lang, shareSlug } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);
  const prefix = `/${locale}`;
  const report = await getCampaignReportBySlug(shareSlug, lang);

  if (!report) {
    notFound();
  }

  const maxDaily = Math.max(
    ...report.daily.map((day) => Math.max(day.sent, day.clicks)),
    1
  );
  const executiveSummary = getCampaignExecutiveSummary({
    isActive: report.campaign.isActive,
    analytics: {
      sent: report.metrics.sent,
      clicks: report.metrics.clicks,
      ctr: report.metrics.ctr,
      topKeywords: report.topKeywords,
    },
  }, locale);

  return (
    <main className={`${siteFontVariables} min-h-screen bg-paper font-site text-ink`}>
      <section className="border-b border-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-coral-dark">{t("Client campaign report")}</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold font-heading leading-tight text-ink sm:text-5xl">
                {report.campaign.name}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                <span>@{report.campaign.instagramUsername}</span>
                {report.campaign.goal && (
                  <>
                    <span>·</span>
                    <span>{campaignTranslator(locale)(report.campaign.goal)}</span>
                  </>
                )}
                <span>·</span>
                <span>
                  {report.campaign.isActive ? t("Active campaign") : t("Paused campaign")}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white p-4 text-sm text-ink-soft md:min-w-64">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Workspace")}</p>
              <p className="mt-2 font-bold text-ink">{report.workspace.name}</p>
              <p className="mt-4 text-xs text-ink-muted">{t("Generated")}{" "}{formatDate(report.generatedAt, locale)}
              </p>
              {report.branded && (
                <Link
                  href={prefix}
                  className="mt-4 inline-flex items-center justify-center border border-coral/30 bg-coral-soft px-3 py-2 text-xs font-semibold text-coral-dark transition hover:border-coral/60"
                >{t("Powered by MeuPerfil")}</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-coral/30 bg-coral-soft p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-coral-dark">{t("Executive summary")}</p>
              <h2 className="mt-2 text-2xl font-bold font-heading text-ink">{campaignTranslator(locale)(executiveSummary.priority)}</h2>
            </div>
            <div className="rounded-full border border-coral/30 bg-white px-3 py-1 text-xs font-semibold text-coral-dark">
              {executiveSummary.ctr}% CTR
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">{executiveSummary.recommendation}</p>
          <p className="mt-3 text-sm font-medium text-coral-dark">{t("Next move:")}{" "}{executiveSummary.nextAction}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label={t("DMs sent")}
            value={report.metrics.sent}
            helper={t("Private replies successfully sent.")}
          />
          <MetricCard
            label={t("Skipped")}
            value={report.metrics.skipped}
            helper={t("Duplicates, limits, or no-send outcomes.")}
          />
          <MetricCard
            label={t("Failed")}
            value={report.metrics.failed}
            helper={t("Replies that need operational review.")}
          />
          <MetricCard
            label={t("Clicks")}
            value={report.metrics.clicks}
            helper={t("Tracked link visits from replies.")}
          />
          <MetricCard
            label="CTR"
            value={`${report.metrics.ctr}%`}
            helper={t("Clicks divided by sent replies.")}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl border border-line bg-white p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold font-heading text-ink">{t("Last 7 Days")}</h2>
                <p className="mt-2 text-sm text-ink-soft">{t("Sent replies and tracked clicks by day.")}</p>
              </div>
              <p className="text-xs text-ink-muted">{t("Last send:")}{" "}{formatDate(report.metrics.latestSentAt, locale)}
              </p>
            </div>
            <div className="mt-8 grid h-56 grid-cols-7 items-end gap-3">
              {report.daily.map((day) => (
                <div key={day.date} className="flex h-full flex-col justify-end gap-2">
                  <div className="flex min-h-0 flex-1 items-end gap-1">
                    <div
                      className="w-full bg-coral/75"
                      style={{
                        height: `${Math.max((day.sent / maxDaily) * 100, 4)}%`,
                      }}
                      title={`${day.sent} ${t("Sent replies")}`}
                    />
                    <div
                      className="w-full bg-moss/75"
                      style={{
                        height: `${Math.max((day.clicks / maxDaily) * 100, 4)}%`,
                      }}
                      title={`${day.clicks} ${t("Clicks")}`}
                    />
                  </div>
                  <p className="truncate text-center text-[11px] text-ink-muted">
                    {day.date}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 bg-coral" />{t("Sent replies")}</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 bg-moss" />{t("Link clicks")}</span>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-xl font-bold font-heading text-ink">{t("Top Keywords")}</h2>
              <div className="mt-5 space-y-3">
                {report.topKeywords.length === 0 && (
                  <p className="text-sm text-ink-soft">{t("No matched keyword data yet.")}</p>
                )}
                {report.topKeywords.map((keyword) => (
                  <div
                    key={keyword.keyword}
                    className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-semibold text-ink">
                      {keyword.keyword}
                    </span>
                    <span className="text-sm text-ink-soft">
                      {keyword.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-xl font-bold font-heading text-ink">{t("Tracked Links")}</h2>
              <div className="mt-5 space-y-3">
                {report.trackedLinks.length === 0 && (
                  <p className="text-sm text-ink-soft">{t("This campaign does not have a tracked link.")}</p>
                )}
                {report.trackedLinks.map((link) => (
                  <div
                    key={link.slug}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="min-w-0 truncate text-sm text-ink-soft">
                      {link.destinationHost}
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {link.clicks}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 border border-line bg-white p-6">
          <h2 className="text-xl font-bold font-heading text-ink">{t("Campaign Setup")}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Keywords")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.campaign.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="border border-line bg-paper px-2 py-1 text-xs font-semibold text-ink-soft"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Created")}</p>
              <p className="mt-3 text-sm text-ink-soft">
                {formatDate(report.campaign.createdAt, locale)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Source post")}</p>
              {report.campaign.postUrl ? (
                <a
                  href={report.campaign.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-coral-dark transition hover:text-coral"
                >{t("View Instagram post")}</a>
              ) : (
                <p className="mt-3 text-sm text-ink-soft">{t("Not attached")}</p>
              )}
            </div>
          </div>
        </section>

        {report.branded && (
          <footer className="mt-8 border-t border-line pt-6 text-center text-xs text-ink-muted">{t("Built with MeuPerfil, the Instagram comment-to-DM campaign OS.")}</footer>
        )}
      </section>
    </main>
  );
}
