"use client";

import { useFlowTranslation } from "@/lib/i18n/use-flow-translation";

/** "YYYY-MM-DD" from the date input → end of that day in the viewer's timezone. */
export function endOfDayIso(date: string): string | null {
  return date ? new Date(`${date}T23:59:59`).toISOString() : null;
}

/** ISO timestamp → "YYYY-MM-DD" in the viewer's timezone, for the date input. */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface Props {
  typoTolerance: boolean;
  onTypoToleranceChange: (value: boolean) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
}

export default function CampaignExtraOptions({ typoTolerance, onTypoToleranceChange, endDate, onEndDateChange }: Props) {
  const t = useFlowTranslation();
  const today = isoToDateInput(new Date().toISOString());

  return (
    <>
      <label className="flex items-center gap-3 cursor-pointer group">
        <button
          type="button"
          onClick={() => onTypoToleranceChange(!typoTolerance)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${typoTolerance ? "bg-accent" : "bg-zinc-700"}`}
          aria-pressed={typoTolerance}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${typoTolerance ? "left-6" : "left-1"}`}
          />
        </button>
        <div>
          <span className="text-sm font-medium text-foreground">{t("Accept small typos")}</span>
          <p className="text-xs text-muted">
            {t("One wrong, missing or extra letter in keywords with 5+ letters (\"QERO\" triggers \"QUERO\"). May also catch similar real words.")}
          </p>
        </div>
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">{t("End date (optional)")}</span>
        <div className="flex items-center gap-3">
          <input
            type="date"
            min={today}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground focus:border-accent/40 focus:outline-none [color-scheme:dark]"
          />
          {endDate && (
            <button type="button" onClick={() => onEndDateChange("")} className="text-xs text-muted hover:text-foreground">
              {t("No end date")}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          {endDate
            ? t("Stops answering after this day. You can extend or clear it later.")
            : t("Without an end date the campaign answers for as long as it is active.")}
        </p>
      </div>
    </>
  );
}
