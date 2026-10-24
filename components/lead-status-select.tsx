"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardMessages } from "@/lib/i18n/dashboard";
const statuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
export default function LeadStatusSelect({ id, status, locale, editable }: { id: string; status: string; locale: string; editable: boolean }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const t = dashboardMessages(locale);
  async function update(value: string) {
    setSaving(true); setError(false);
    try {
      const response = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) });
      if (!response.ok) throw new Error("Failed");
      router.refresh();
    } catch { setError(true); }
    finally { setSaving(false); }
  }
  return <div>
    <select aria-label={t.status} value={status} disabled={saving || !editable} onChange={(event) => void update(event.target.value)} className="rounded-lg border border-border bg-surface p-2 text-sm">
      {statuses.map((value) => <option key={value} value={value}>{t[value]}</option>)}
    </select>
    {error && <p role="alert" className="mt-1 text-xs text-error">{t.saveError}</p>}
  </div>;
}
