import type { Metadata } from "next";
import LegalDocumentView from "@/components/site/legal-document";
import { getLegalDocument } from "@/lib/legal/content";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

type Props = { params: Promise<{ lang: string }> };

async function resolveLocale(params: Props["params"]): Promise<Locale> {
  const { lang } = await params;
  return hasLocale(lang) ? lang : defaultLocale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getLegalDocument("privacy", await resolveLocale(params));
  return { title: doc.metaTitle, description: doc.metaDescription };
}

export default async function PrivacyPage({ params }: Props) {
  const locale = await resolveLocale(params);
  return <LegalDocumentView doc={getLegalDocument("privacy", locale)} locale={locale} />;
}
