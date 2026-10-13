import type { Metadata } from "next";
import SeoPageShell from "@/components/seo-page-shell";
import { agenciesSeoPage } from "@/lib/seo-pages";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export const metadata: Metadata = {
  title: "Instagram DM Automation for Agencies",
  description:
    "Instagram DM automation for agencies with multi-account workspaces, comment-to-DM campaigns, tracked links, and shareable client reports.",
  alternates: { canonical: "/instagram-dm-automation-agencies" },
  openGraph: {
    title: "Instagram DM Automation for Agencies",
    description:
      "Manage client Instagram comment-to-DM campaigns with MeuPerfil agency workspaces.",
    url: "/instagram-dm-automation-agencies",
  },
};

export default async function InstagramDmAutomationAgenciesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  return <SeoPageShell config={agenciesSeoPage} locale={locale} />;
}
