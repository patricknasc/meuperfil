import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getThemeConfig } from "@/lib/profiles/themes";
import { storeTranslator } from "@/lib/i18n/store";
import { getPublicStoreByHandle, searchCatalog } from "@/lib/store/service";
import { catalogQuerySchema, type CatalogQuery } from "@/lib/store/validation";
import { StoreShell } from "@/components/store/store-shell";
import { ProductCard } from "@/components/store/product-card";

interface PageProps {
  params: Promise<{ lang: string; handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseQuery(raw: Record<string, string | string[] | undefined>): CatalogQuery {
  const flat = Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]) => [key, first(value)])
      .filter(([, value]) => value !== undefined && value !== "")
  );
  return catalogQuerySchema.parse(flat);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, handle } = await params;
  const t = storeTranslator(lang);
  const data = await getPublicStoreByHandle(handle);
  if (!data) return { title: `${t("Loja não encontrada")} | meuperfil.me`, robots: { index: false, follow: false } };
  const title = `${data.store.name} — ${t("Loja")} | meuperfil.me`;
  const description = data.store.description || `${t("Loja")} @${data.profile.handle}`;
  return {
    title,
    description,
    alternates: { canonical: `https://meuperfil.me/${lang}/${data.profile.handle}/loja` },
    openGraph: { title, description, url: `https://meuperfil.me/${lang}/${data.profile.handle}/loja` },
  };
}

export default async function StoreCatalogPage({ params, searchParams }: PageProps) {
  const { lang, handle } = await params;
  const t = storeTranslator(lang);
  const data = await getPublicStoreByHandle(handle);
  if (!data) notFound();

  const { profile, store } = data;
  const query = parseQuery(await searchParams);
  const catalog = await searchCatalog(store.id, query);
  const theme = getThemeConfig(profile.theme);
  const base = `/${lang}/${profile.handle}/loja`;
  const hasFilters = Boolean(query.q || query.category || query.type || query.min !== undefined || query.max !== undefined);
  const field = `w-full rounded-xl border border-current/20 bg-transparent px-3 py-2 text-sm placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-current/30`;

  const pageHref = (page: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && key !== "page") qs.set(key, String(value));
    }
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <StoreShell lang={lang} profile={profile} storeName={store.name}>
      <div className="space-y-5">
        <div>
          <h1 className={`text-2xl ${theme.classes.displayName}`}>{store.name}</h1>
          {store.description && <p className={`mt-1 max-w-2xl text-sm leading-6 ${theme.classes.bio}`}>{store.description}</p>}
        </div>

        <form action={base} method="get" className="space-y-3" role="search">
          <div className="flex gap-2">
            <label htmlFor="q" className="sr-only">
              {t("Buscar produtos")}
            </label>
            <input id="q" name="q" type="search" defaultValue={query.q} placeholder={t("Buscar produtos")} className={field} />
            <button type="submit" className={`shrink-0 px-4 py-2 text-sm font-semibold ${theme.classes.linkRadius ?? "rounded-xl"} ${theme.classes.linkCard}`}>
              {t("Buscar")}
            </button>
          </div>

          <details className="group" open={hasFilters || undefined}>
            <summary className={`cursor-pointer select-none text-sm font-semibold ${theme.classes.bio}`}>{t("Filtrar")}</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
              <label className="space-y-1 text-xs">
                <span className={theme.classes.bio}>{t("Categoria")}</span>
                <select name="category" defaultValue={query.category ?? ""} className={field}>
                  <option value="">{t("Todas")}</option>
                  {catalog.categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className={theme.classes.bio}>{t("Tipo")}</span>
                <select name="type" defaultValue={query.type ?? ""} className={field}>
                  <option value="">{t("Todos")}</option>
                  <option value="PHYSICAL">{t("Produto")}</option>
                  <option value="DIGITAL">{t("Digital")}</option>
                  <option value="SERVICE">{t("Serviço")}</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className={theme.classes.bio}>{t("Preço mínimo")}</span>
                <input name="min" type="number" min={0} inputMode="numeric" defaultValue={query.min} placeholder="R$" className={field} />
              </label>
              <label className="space-y-1 text-xs">
                <span className={theme.classes.bio}>{t("Preço máximo")}</span>
                <input name="max" type="number" min={0} inputMode="numeric" defaultValue={query.max} placeholder="R$" className={field} />
              </label>
              <label className="col-span-2 space-y-1 text-xs md:col-span-1">
                <span className={theme.classes.bio}>{t("Ordenar")}</span>
                <select name="sort" defaultValue={query.sort ?? "relevance"} className={field}>
                  <option value="relevance">{t("Relevância")}</option>
                  <option value="newest">{t("Mais novos")}</option>
                  <option value="price_asc">{t("Menor preço")}</option>
                  <option value="price_desc">{t("Maior preço")}</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex gap-3 text-sm">
              <button type="submit" className={`px-4 py-2 font-semibold ${theme.classes.linkRadius ?? "rounded-xl"} ${theme.classes.linkCard}`}>
                {t("Filtrar")}
              </button>
              {hasFilters && (
                <Link href={base} className={`px-2 py-2 underline ${theme.classes.bio}`}>
                  {t("Limpar")}
                </Link>
              )}
            </div>
          </details>
        </form>

        {catalog.categories.length > 0 && (
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label={t("Categoria")}>
            <Link
              href={base}
              aria-current={!query.category ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${!query.category ? theme.classes.handleBadge : `border border-current/20 ${theme.classes.bio}`}`}
            >
              {t("Todas")}
            </Link>
            {catalog.categories.map((c) => (
              <Link
                key={c.id}
                href={`${base}?category=${encodeURIComponent(c.slug)}`}
                aria-current={query.category === c.slug ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${query.category === c.slug ? theme.classes.handleBadge : `border border-current/20 ${theme.classes.bio}`}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        {catalog.products.length === 0 ? (
          <div className="py-16 text-center">
            <p className={`text-base font-semibold ${theme.classes.displayName}`}>{t("Nenhum produto encontrado")}</p>
            <p className={`mt-1 text-sm ${theme.classes.bio}`}>
              {hasFilters ? t("Tente outra busca ou limpe os filtros.") : t("Esta loja ainda não tem produtos.")}
            </p>
          </div>
        ) : (
          <>
            <p className={`text-xs ${theme.classes.bio}`}>
              {catalog.total} {t("produtos")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {catalog.products.map((product) => (
                <ProductCard key={product.id} product={product} href={`${base}/${product.slug}`} lang={lang} theme={theme} />
              ))}
            </div>
          </>
        )}

        {catalog.pageCount > 1 && (
          <nav className="flex items-center justify-between pt-2 text-sm" aria-label={t("Página")}>
            {catalog.page > 1 ? (
              <Link href={pageHref(catalog.page - 1)} className="underline">
                {t("Anterior")}
              </Link>
            ) : (
              <span />
            )}
            <span className={theme.classes.bio}>
              {t("Página")} {catalog.page} {t("de")} {catalog.pageCount}
            </span>
            {catalog.page < catalog.pageCount ? (
              <Link href={pageHref(catalog.page + 1)} className="underline">
                {t("Próxima")}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </StoreShell>
  );
}
