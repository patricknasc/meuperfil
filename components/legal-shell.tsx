import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import type { Locale } from "@/app/[lang]/dictionaries";

interface LegalShellProps {
  title: string;
  description: string;
  updatedAt: string;
  locale?: Locale;
  children: React.ReactNode;
}

export default function LegalShell({
  title,
  description,
  updatedAt,
  locale = "pt",
  children,
}: LegalShellProps) {
  const prefix = `/${locale}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href={prefix} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-cyan-200/20 bg-cyan-300/10 text-sm font-black text-cyan-100">
              MP
            </span>
            <span className="text-lg font-bold text-white">MeuPerfil</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <Link
              href={`${prefix}/login`}
              className="text-sm font-semibold text-zinc-300 transition hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-sm font-semibold uppercase text-cyan-200">
          Last updated {updatedAt}
        </p>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-8 text-zinc-300">{description}</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-300">
          {children}
        </div>
      </article>
    </main>
  );
}
