import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getThemeConfig, themeStyle } from "@/lib/profiles/themes";
import { profileFontVariables } from "@/lib/profiles/fonts";
import { storeTranslator } from "@/lib/i18n/store";
import { CartButton } from "./cart-button";

interface StoreShellProps {
  lang: string;
  profile: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    theme: string;
    themeSettings: unknown;
  };
  storeName: string;
  children: ReactNode;
}

/** Themed frame shared by the shop, product, cart and order pages of a profile. */
export function StoreShell({ lang, profile, storeName, children }: StoreShellProps) {
  const theme = getThemeConfig(profile.theme);
  const t = storeTranslator(lang);

  return (
    <main
      className={`min-h-screen ${theme.classes.background} ${theme.classes.container} ${profileFontVariables}`}
      style={themeStyle(profile.theme, profile.themeSettings)}
    >
      <header className="sticky top-0 z-20 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            href={`/${lang}/${profile.handle}`}
            className="flex min-w-0 flex-1 items-center gap-3"
            aria-label={t("Voltar ao perfil")}
          >
            {profile.avatarUrl ? (
              <Image
                unoptimized
                width={36}
                height={36}
                src={profile.avatarUrl}
                alt=""
                className={`h-9 w-9 shrink-0 rounded-full border object-cover ${theme.classes.avatarBorder}`}
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-black text-white">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className={`block truncate text-sm ${theme.classes.displayName}`}>{storeName}</span>
              <span className={`block truncate text-xs ${theme.classes.bio}`}>@{profile.handle}</span>
            </span>
          </Link>
          <CartButton
            handle={profile.handle}
            href={`/${lang}/${profile.handle}/carrinho`}
            label={t("Carrinho")}
            className={`${theme.classes.socialIconBg} ${theme.classes.socialIconText}`}
          />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-2">{children}</div>

      <footer className="pb-6 text-center">
        <Link
          href={`/${lang}`}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-75 transition-opacity hover:opacity-100 ${theme.classes.footerText}`}
        >
          <span>{t("Criado com")}</span>
          <strong className="font-bold">meuperfil.me</strong>
        </Link>
      </footer>
    </main>
  );
}
