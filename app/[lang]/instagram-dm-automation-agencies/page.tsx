import type { Metadata } from "next";
import SeoPageShell from "@/components/seo-page-shell";
import { agenciesSeoPage, localizeSeoPage } from "@/lib/seo-pages";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const config = localizeSeoPage(agenciesSeoPage, locale);
  const canonical = `/${locale}/instagram-dm-automation-agencies`;
  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical,
      languages: { pt: "/pt/instagram-dm-automation-agencies", en: "/en/instagram-dm-automation-agencies", es: "/es/instagram-dm-automation-agencies" },
    },
    openGraph: { title: config.title, description: config.description, url: canonical },
  };
}

export default async function InstagramDmAutomationAgenciesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  return <SeoPageShell config={localizeSeoPage(agenciesSeoPage, locale)} locale={locale} />;
}
