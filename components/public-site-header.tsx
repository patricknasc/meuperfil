import { publicTranslator } from "@/lib/i18n/public";
import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import type { Locale } from "@/app/[lang]/dictionaries";

interface PublicSiteHeaderProps {
  active?: "home" | "templates";
  locale?: Locale;
  dict?: {
    templates?: string;
    agencies?: string;
    pricing?: string;
    security?: string;
    signIn?: string;
    startFree?: string;
  };
}

export default function PublicSiteHeader({
  active,
  locale = "pt",
  dict,
}: PublicSiteHeaderProps) {
  const t = publicTranslator(locale);
  const prefix = `/${locale}`;

  const navLinks = [
    { label: dict?.templates ?? t("Templates"), href: `${prefix}/templates`, key: "templates" },
    {
      label: dict?.agencies ?? t("Agencies"),
      href: `${prefix}/instagram-dm-automation-agencies`,
      key: "agencies",
    },
    { label: dict?.pricing ?? t("Pricing"), href: `${prefix}#pricing`, key: "pricing" },
    { label: dict?.security ?? t("Security"), href: `${prefix}#security`, key: "security" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href={prefix} className="flex items-center gap-2.5" aria-label="meuperfil.me home">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-black text-white shadow-md shadow-indigo-500/20">
            MP
          </div>
          <span className="text-lg font-bold text-white tracking-tight">meuperfil<span className="text-accent">.me</span></span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`text-sm font-medium transition ${
                active === link.key ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href={`${prefix}/login`}
            className="hidden px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white sm:inline-flex"
          >
            {dict?.signIn ?? t("Sign in")}
          </Link>
          <Link
            href={`${prefix}/login`}
            className="inline-flex items-center justify-center bg-cyan-300 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-cyan-200"
          >
            {dict?.startFree ?? t("Start free")}
          </Link>
        </div>
      </div>
    </header>
  );
}
