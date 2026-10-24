import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import { Logo } from "@/components/site/logo";
import type { Locale } from "@/app/[lang]/dictionaries";
import { getSiteCopy } from "@/lib/i18n/site";

/** Header for the public site. On inner pages the section links point back to the home. */
export default function SiteHeader({ locale, onHome = false }: { locale: Locale; onHome?: boolean }) {
  const copy = getSiteCopy(locale);
  const home = `/${locale}`;
  const anchor = (id: string) => (onHome ? `#${id}` : `${home}#${id}`);
  const links = [
    { href: anchor("como-funciona"), label: copy.nav.how },
    { href: anchor("recursos"), label: copy.nav.features },
    { href: anchor("precos"), label: copy.nav.pricing },
    { href: anchor("duvidas"), label: copy.nav.faq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href={home} aria-label="meuperfil.me">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher currentLocale={locale} tone="light" />
          <Link href={`${home}/login`} className="hidden px-2 text-sm font-semibold text-ink-soft transition hover:text-ink sm:block">
            {copy.nav.signIn}
          </Link>
          <Link
            href={`${home}/login`}
            className="hidden rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-coral-dark sm:block"
          >
            {copy.nav.cta}
          </Link>
          <Link
            href={`${home}/login`}
            className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-coral-dark sm:hidden"
          >
            {copy.nav.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
