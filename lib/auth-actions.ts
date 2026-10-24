"use server";

import { signOut } from "@/lib/auth";
import { hasLocale, defaultLocale } from "@/app/[lang]/dictionaries";

export async function signOutAction(locale: string) {
  const lang = hasLocale(locale) ? locale : defaultLocale;
  await signOut({ redirectTo: `/${lang}/login` });
}
