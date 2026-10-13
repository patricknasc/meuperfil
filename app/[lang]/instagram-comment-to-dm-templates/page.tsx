import type { Metadata } from "next";
import SeoPageShell from "@/components/seo-page-shell";
import { templatesSeoPage } from "@/lib/seo-pages";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export const metadata: Metadata = {
  title: "Instagram Comment-to-DM Templates for Campaigns",
  description:
    "Browse Instagram comment-to-DM templates for lead magnets, product links, price replies, launch waitlists, creators, and agencies.",
  alternates: { canonical: "/instagram-comment-to-dm-templates" },
  openGraph: {
    title: "Instagram Comment-to-DM Templates for Campaigns",
    description:
      "Start with MeuPerfil templates for high-intent Instagram keyword comments and private replies.",
    url: "/instagram-comment-to-dm-templates",
  },
};

export default async function InstagramCommentToDmTemplatesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  return <SeoPageShell config={templatesSeoPage} locale={locale} />;
}
