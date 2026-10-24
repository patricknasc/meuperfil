import type { Metadata } from "next";
import SeoPageShell from "@/components/seo-page-shell";
import { commentLinkSeoPage, localizeSeoPage } from "@/lib/seo-pages";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const config = localizeSeoPage(commentLinkSeoPage, locale);
  const canonical = `/${locale}/comment-link-automation`;
  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical,
      languages: { pt: "/pt/comment-link-automation", en: "/en/comment-link-automation", es: "/es/comment-link-automation" },
    },
    openGraph: { title: config.title, description: config.description, url: canonical },
  };
}

export default async function CommentLinkAutomationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  return <SeoPageShell config={localizeSeoPage(commentLinkSeoPage, locale)} locale={locale} />;
}
