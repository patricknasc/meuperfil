import type { Metadata } from "next";
import SeoPageShell from "@/components/seo-page-shell";
import { manychatAlternativePage, localizeSeoPage } from "@/lib/seo-pages";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const config = localizeSeoPage(manychatAlternativePage, locale);
  const canonical = `/${locale}/manychat-alternative`;
  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical,
      languages: { pt: "/pt/manychat-alternative", en: "/en/manychat-alternative", es: "/es/manychat-alternative" },
    },
    openGraph: { title: config.title, description: config.description, url: canonical },
  };
}

export default async function ManychatAlternativePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  return <SeoPageShell config={localizeSeoPage(manychatAlternativePage, locale)} locale={locale} />;
}
