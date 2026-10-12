import type { Metadata } from "next";
import SeoPageShell from "@/components/seo-page-shell";
import { templatesSeoPage, localizeSeoPage } from "@/lib/seo-pages";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const config = localizeSeoPage(templatesSeoPage, locale);
  const canonical = `/${locale}/instagram-comment-to-dm-templates`;
  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical,
      languages: { pt: "/pt/instagram-comment-to-dm-templates", en: "/en/instagram-comment-to-dm-templates", es: "/es/instagram-comment-to-dm-templates" },
    },
    openGraph: { title: config.title, description: config.description, url: canonical },
  };
}

export default async function InstagramCommentToDmTemplatesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  return <SeoPageShell config={localizeSeoPage(templatesSeoPage, locale)} locale={locale} />;
}
