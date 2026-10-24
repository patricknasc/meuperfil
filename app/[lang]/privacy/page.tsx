import type { Metadata } from "next";
import LegalDocumentView from "@/components/site/legal-document";
import { getLegalDocument, type LegalKind } from "@/lib/legal/content";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

const KIND: LegalKind = "privacy";
type Props = { params: Promise<{ lang: string }> };

async function resolveLocale(params: Props["params"]): Promise<Locale> {
  const { lang } = await params;
  return hasLocale(lang) ? lang : defaultLocale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await getLegalDocument(KIND, await resolveLocale(params));
  return { title: doc.metaTitle, description: doc.metaDescription };
}

export default async function LegalPage({ params }: Props) {
  const locale = await resolveLocale(params);
  return <LegalDocumentView doc={await getLegalDocument(KIND, locale)} locale={locale} />;
}
