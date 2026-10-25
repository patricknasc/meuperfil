"use client";

import Link from "next/link";
import { storeTranslator } from "@/lib/i18n/store";

export interface StoreBlockConfigValue {
  mode: "featured" | "newest";
  limit: number;
}

export function parseStoreBlockConfig(config: Record<string, unknown> | undefined | null): StoreBlockConfigValue {
  return {
    mode: config?.mode === "newest" ? "newest" : "featured",
    limit: typeof config?.limit === "number" ? config.limit : 4,
  };
}

const fieldClass =
  "w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition";
const labelClass = "block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5";

/** Gallery options for a STORE block in the profile editor. */
export function StoreBlockFields({
  lang,
  value,
  onChange,
}: {
  lang: string;
  value: StoreBlockConfigValue;
  onChange: (value: StoreBlockConfigValue) => void;
}) {
  const t = storeTranslator(lang);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>{t("Mostrar")}</span>
          <select value={value.mode} onChange={(e) => onChange({ ...value, mode: e.target.value as StoreBlockConfigValue["mode"] })} className={fieldClass}>
            <option value="featured">{t("Destaques primeiro")}</option>
            <option value="newest">{t("Mais novos")}</option>
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>{t("Quantidade")}</span>
          <select value={value.limit} onChange={(e) => onChange({ ...value, limit: Number(e.target.value) })} className={fieldClass}>
            {[2, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n} {t("produtos")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-muted">
        {t("Os produtos vêm da sua loja.")}{" "}
        <Link href={`/${lang}/store`} className="font-semibold text-accent underline">
          {t("Gerenciar produtos")}
        </Link>
      </p>
    </div>
  );
}
