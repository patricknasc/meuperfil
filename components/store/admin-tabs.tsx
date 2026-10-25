"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { storeTranslator } from "@/lib/i18n/store";

const tabs = [
  { path: "/store", label: "Produtos", match: (p: string) => p === "/store" || p.startsWith("/store/products") },
  { path: "/store/orders", label: "Pedidos", match: (p: string) => p.startsWith("/store/orders") },
  { path: "/store/settings", label: "Configurações", match: (p: string) => p.startsWith("/store/settings") },
] as const;

export function StoreAdminTabs({ lang }: { lang: string }) {
  const t = storeTranslator(lang);
  const pathname = usePathname();
  const subPath = pathname.replace(/^\/(pt|en|es)/, "") || "/";

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0" aria-label={t("Loja")}>
      {tabs.map((tab) => {
        const active = tab.match(subPath);
        return (
          <Link
            key={tab.path}
            href={`/${lang}${tab.path}`}
            aria-current={active ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t(tab.label)}
          </Link>
        );
      })}
    </nav>
  );
}
