import Link from "next/link";
import { Logo } from "@/components/site/logo";
import type { Locale } from "@/app/[lang]/dictionaries";
import { getSiteCopy } from "@/lib/i18n/site";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/content";

export default function SiteFooter({ locale, onHome = false }: { locale: Locale; onHome?: boolean }) {
  const copy = getSiteCopy(locale);
  const home = `/${locale}`;
  const anchor = (id: string) => (onHome ? `#${id}` : `${home}#${id}`);

  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-muted">{copy.footer.tagline}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-muted">{copy.footer.product}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li><a href={anchor("como-funciona")} className="hover:text-ink">{copy.nav.how}</a></li>
            <li><a href={anchor("recursos")} className="hover:text-ink">{copy.nav.features}</a></li>
            <li><a href={anchor("precos")} className="hover:text-ink">{copy.nav.pricing}</a></li>
            <li><Link href={`${home}/templates`} className="hover:text-ink">{copy.footer.templates}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-muted">{copy.footer.legal}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li><Link href={`${home}/privacy`} className="hover:text-ink">{copy.footer.privacy}</Link></li>
            <li><Link href={`${home}/terms`} className="hover:text-ink">{copy.footer.terms}</Link></li>
            <li><Link href={`${home}/data-deletion`} className="hover:text-ink">{copy.footer.dataDeletion}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-muted">{copy.footer.contact}</p>
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="mt-4 block break-all text-sm text-ink-soft hover:text-ink">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-ink-muted sm:px-8">
          © {new Date().getFullYear()} MeuPerfil. {copy.footer.rights}
        </p>
      </div>
    </footer>
  );
}
