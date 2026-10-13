import { redirect } from "next/navigation";
import { hasLocale, defaultLocale, type Locale } from "@/app/[lang]/dictionaries";

export default async function NewAutomationRedirectPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  redirect(`/${locale}/campaigns/new`);
}
