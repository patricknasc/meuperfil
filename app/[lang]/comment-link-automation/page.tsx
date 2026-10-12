import type { Metadata } from "next";
import SeoPageShell from "@/components/seo-page-shell";
import { commentLinkSeoPage } from "@/lib/seo-pages";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export const metadata: Metadata = {
  title: "Comment LINK Automation for Instagram",
  description:
    "Automate Instagram comment LINK replies with keyword matching, Meta-compliant private replies, tracked links, and campaign analytics.",
  alternates: { canonical: "/comment-link-automation" },
  openGraph: {
    title: "Comment LINK Automation for Instagram",
    description:
      "Turn LINK, SHOP, GUIDE, and PRICE comments into tracked private replies with MeuPerfil.",
    url: "/comment-link-automation",
  },
};

export default async function CommentLinkAutomationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  return <SeoPageShell config={commentLinkSeoPage} locale={locale} />;
}
