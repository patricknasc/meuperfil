"use client";

import { useParams } from "next/navigation";
import { landingTranslator } from "@/lib/i18n/landing";
import type { CampaignTemplate } from "@/lib/templates/campaign-templates";

const accentClasses: Record<CampaignTemplate["accent"], string> = {
  cyan: "bg-[#e3f1f5]",
  emerald: "bg-[#e2f0ea]",
  rose: "bg-coral-soft",
  amber: "bg-[#f8ecd6]",
};

interface TemplateVisualProps {
  template: CampaignTemplate;
  compact?: boolean;
}

export default function TemplateVisual({
  template,
  compact = false,
}: TemplateVisualProps) {
  const { lang } = useParams<{ lang: string }>();
  const t = landingTranslator(lang);
  return (
    <div className={`rounded-3xl p-3 ${accentClasses[template.accent]}`}>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink-muted">{t("Comment trigger")}</p>
            <p className="mt-1 font-heading text-base font-semibold text-ink">{t(template.triggerExample)}</p>
          </div>
          <span className="max-w-[48%] rounded-2xl bg-paper px-3 py-1 text-right text-[11px] font-semibold leading-4 text-ink-soft">{t(template.category)}</span>
        </div>
        <div className={`grid gap-3 pt-4 ${compact ? "" : "sm:grid-cols-2"}`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink-muted">{t("Keywords")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {template.keywords.map((keyword) => (
                <span key={keyword} className="rounded-md bg-coral px-2 py-0.5 text-xs font-bold text-white">{keyword}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl rounded-bl-md bg-ink p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-paper/50">{t("Private reply")}</p>
            <p className="mt-1.5 text-sm leading-6 text-paper">{t(template.privateReplyPreview)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
