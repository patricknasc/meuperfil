"use client";

import { useParams } from "next/navigation";
import { workspaceTranslator, workspaceDateLocale } from "@/lib/i18n/workspace";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/status-badge";

interface DiagnosticsData {
  queueCounts: Record<string, number>;
  workerHealth: {
    healthy: boolean;
    ageMs: number | null;
    heartbeat: {
      checkedAt: string;
      hostname?: string;
      pid?: number;
      startedAt?: string;
    } | null;
  };
  workerAlerts: Array<{
    level: string;
    message: string;
    jobId?: string;
    commentId?: string;
    createdAt: string;
  }>;
  webhookFailures: Array<{
    id: string;
    object: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  billingEvents: Array<{
    id: string;
    stripeEventId: string;
    type: string;
    processedAt: string;
  }>;
  dmFailures: Array<{
    id: string;
    status: string;
    commentId: string;
    commentText: string;
    errorMessage: string | null;
    updatedAt: string;
    automation: { name: string };
  }>;
  tokenRefreshFailures: Array<{
    id: string;
    message: string;
    createdAt: string;
  }>;
  operationalEvents: Array<{
    id: string;
    source: string;
    level: string;
    message: string;
    createdAt: string;
    resolvedAt: string | null;
  }>;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale);
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-5 text-center text-sm text-muted">{label}</p>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DiagnosticsPage() {
  const { lang } = useParams<{ lang: string }>();
  const t = workspaceTranslator(lang);
  const dateLocale = workspaceDateLocale(lang);
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshDiagnostics() {
    setLoading(true);
    const response = await fetch("/api/admin/diagnostics");
    const payload = await response.json();
    if (payload.success) {
      setData(payload.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialDiagnostics() {
      const response = await fetch("/api/admin/diagnostics");
      const payload = await response.json();
      if (active && payload.success) {
        setData(payload.data);
      }
      if (active) {
        setLoading(false);
      }
    }

    void loadInitialDiagnostics();

    return () => {
      active = false;
    };
  }, []);

  if (loading && !data) {
    return <div className="glass rounded-2xl p-8 h-64 animate-pulse" />;
  }

  const workerAgeSeconds =
    data?.workerHealth.ageMs == null
      ? null
      : Math.round(data.workerHealth.ageMs / 1000);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-sm leading-6 text-muted">
          {t("Health and failures for this workspace.")}
        </p>
        <button
          onClick={() => void refreshDiagnostics()}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-border-hover"
        >
          {t("Refresh")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase text-muted">
            {t("Worker health")}
          </p>
          <p
            className={`mt-3 text-2xl font-bold ${
              data?.workerHealth.healthy ? "text-success" : "text-warning"
            }`}
          >
            {data?.workerHealth.healthy ? t("Healthy") : t("Needs attention")}
          </p>
          <p className="mt-2 text-xs text-muted">
            {workerAgeSeconds == null
              ? t("No heartbeat found")
              : lang === "en" ? `Last heartbeat ${workerAgeSeconds}s ago` : lang === "es" ? `Última señal hace ${workerAgeSeconds}s` : `Último sinal há ${workerAgeSeconds}s`}
          </p>
        </div>
        {["pending", "sent", "failed"].map((key) => (
          <div key={key} className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase text-muted">
              {t("Workspace DMs")}: {t(key === "pending" ? "Pending" : key === "sent" ? "Sent" : "Failed")}
            </p>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {data?.queueCounts[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <Section title={t("Recent Worker Alerts")}>
        {data?.workerAlerts.length ? (
          <div className="space-y-3">
            {data.workerAlerts.map((alert) => (
              <div
                key={`${alert.createdAt}-${alert.jobId ?? alert.message}`}
                className="rounded-xl border border-border bg-surface/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {alert.message}
                  </p>
                  <span className="rounded-full bg-error/10 px-2 py-1 text-xs font-semibold text-error">
                    {alert.level}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatDate(alert.createdAt, dateLocale)}
                  {alert.commentId ? ` · ${alert.commentId}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label={t("No worker alerts recorded.")} />
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("Campaign DM Failures And Skips")}>
          {data?.dmFailures.length ? (
            <div className="space-y-3">
              {data.dmFailures.map((item) => (
                <div key={item.id} className="border-b border-border pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.automation.name}
                    </p>
                    <StatusBadge locale={lang} status={item.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {item.commentText}
                  </p>
                  {item.errorMessage && (
                    <p className="mt-1 text-xs text-error">{item.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label={t("No DM failures or skips.")} />
          )}
        </Section>

        <Section title={t("Webhook Failures")}>
          {data?.webhookFailures.length ? (
            <div className="space-y-3">
              {data.webhookFailures.map((event) => (
                <div key={event.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm font-semibold text-foreground">
                    {event.object ?? t("Instagram webhook")}
                  </p>
                  <p className="mt-1 text-xs text-error">
                    {event.errorMessage ?? t("Unknown error")}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(event.createdAt, dateLocale)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label={t("No failed webhook events.")} />
          )}
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("Token Refresh Failures")}>
          {data?.tokenRefreshFailures.length ? (
            <div className="space-y-3">
              {data.tokenRefreshFailures.map((event) => (
                <div key={event.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm font-semibold text-foreground">
                    {event.message}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(event.createdAt, dateLocale)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label={t("No token refresh failures.")} />
          )}
        </Section>

        <Section title={t("Billing Events")}>
          {data?.billingEvents.length ? (
            <div className="space-y-3">
              {data.billingEvents.map((event) => (
                <div key={event.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm font-semibold text-foreground">
                    {event.type}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {event.stripeEventId} · {formatDate(event.processedAt, dateLocale)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label={t("No billing events yet.")} />
          )}
        </Section>
      </div>

      <Section title={t("Operational Event Timeline")}>
        {data?.operationalEvents.length ? (
          <div className="space-y-3">
            {data.operationalEvents.map((event) => (
              <div key={event.id} className="grid gap-2 border-b border-border pb-3 last:border-0 sm:grid-cols-[140px_1fr_auto]">
                <p className="text-xs font-semibold text-muted">{event.source}</p>
                <p className="text-sm text-foreground">{event.message}</p>
                <p className="text-xs text-muted">{formatDate(event.createdAt, dateLocale)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label={t("No operational events recorded.")} />
        )}
      </Section>
    </div>
  );
}
