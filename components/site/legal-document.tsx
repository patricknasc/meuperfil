import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import type { Locale } from "@/app/[lang]/dictionaries";
import type { LegalDocument } from "@/lib/legal/content";
import { siteFontVariables } from "@/lib/site/fonts";

const UPDATED_LABEL: Record<Locale, string> = { pt: "Atualizada em", en: "Last updated", es: "Actualizada el" };
const CONTENTS_LABEL: Record<Locale, string> = { pt: "Nesta página", en: "On this page", es: "En esta página" };

function slug(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function LegalDocumentView({ doc, locale }: { doc: LegalDocument; locale: Locale }) {
  const updated = new Date(`${doc.updatedAt}T12:00:00Z`).toLocaleDateString(locale === "pt" ? "pt-BR" : locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`${siteFontVariables} min-h-screen bg-paper font-site text-ink`}>
      <SiteHeader locale={locale} />
      <main className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[220px_1fr] lg:pt-20">
        <aside className="hidden lg:block">
          <nav className="sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink-muted">{CONTENTS_LABEL[locale]}</p>
            <ul className="mt-4 space-y-2 border-l border-line text-sm">
              {doc.sections.map((section) => (
                <li key={section.heading}>
                  <a href={`#${slug(section.heading)}`} className="-ml-px block border-l border-transparent pl-4 text-ink-muted transition hover:border-coral hover:text-ink">
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <article className="max-w-2xl">
          <p className="text-sm font-medium text-coral-dark">
            {UPDATED_LABEL[locale]} {updated}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">{doc.title}</h1>
          <p className="mt-6 text-lg leading-8 text-ink-soft">{doc.intro}</p>
          <div className="mt-12 space-y-12">
            {doc.sections.map((section) => (
              <section key={section.heading} id={slug(section.heading)} className="scroll-mt-28">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-ink-soft">
                  {section.blocks.map((block, i) =>
                    typeof block === "string" ? (
                      <p key={i}>{block}</p>
                    ) : (
                      <ul key={i} className="space-y-2.5">
                        {block.list.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
