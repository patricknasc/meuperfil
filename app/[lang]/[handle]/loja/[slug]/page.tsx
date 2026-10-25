import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getThemeConfig } from "@/lib/profiles/themes";
import { storeTranslator } from "@/lib/i18n/store";
import { formatPrice } from "@/lib/store/money";
import { getPublicProduct, getPublicStoreByHandle } from "@/lib/store/service";
import { StoreShell } from "@/components/store/store-shell";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCart } from "@/components/store/add-to-cart";

interface PageProps {
  params: Promise<{ lang: string; handle: string; slug: string }>;
}

async function load(handle: string, slug: string) {
  const data = await getPublicStoreByHandle(handle);
  if (!data) return null;
  const product = await getPublicProduct(data.store.id, slug);
  return product ? { ...data, product } : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, handle, slug } = await params;
  const t = storeTranslator(lang);
  const data = await load(handle, slug);
  if (!data) return { title: `${t("Produto não encontrado")} | meuperfil.me`, robots: { index: false, follow: false } };

  const { product, store, profile } = data;
  const title = `${product.name} — ${store.name}`;
  const description = (product.description || `${product.name} · ${formatPrice(product.priceCents, lang)}`).slice(0, 200);
  const images = product.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt || product.name }));
  const url = `https://meuperfil.me/${lang}/${profile.handle}/loja/${product.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images: images.map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { lang, handle, slug } = await params;
  const t = storeTranslator(lang);
  const data = await load(handle, slug);
  if (!data) notFound();

  const { product, store, profile } = data;
  const theme = getThemeConfig(profile.theme);
  const radius = theme.classes.linkRadius ?? "rounded-2xl";
  const lowStock = product.stock !== null && product.stock > 0 && product.stock <= 3;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `https://meuperfil.me/${lang}/${profile.handle}/loja/${product.slug}`,
    },
  };

  return (
    <StoreShell lang={lang} profile={profile} storeName={store.name}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href={`/${lang}/${profile.handle}/loja`} className={`mb-4 inline-block text-sm underline ${theme.classes.bio}`}>
        ← {t("Voltar à loja")}
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <ProductGallery images={product.images} name={product.name} radius={radius} />

        <div className="space-y-5">
          <div className="space-y-2">
            {product.category && (
              <Link
                href={`/${lang}/${profile.handle}/loja?category=${encodeURIComponent(product.category.slug)}`}
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${theme.classes.handleBadge}`}
              >
                {product.category.name}
              </Link>
            )}
            <h1 className={`text-2xl leading-tight ${theme.classes.displayName}`}>{product.name}</h1>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className={`text-2xl font-bold ${theme.classes.displayName}`}>{formatPrice(product.priceCents, lang)}</span>
              {product.compareAtCents && (
                <span className={`text-sm line-through ${theme.classes.bio}`}>{formatPrice(product.compareAtCents, lang)}</span>
              )}
            </div>
            {lowStock && <p className="text-sm font-semibold text-amber-500">{t("Últimas unidades")}</p>}
          </div>

          <AddToCart
            handle={profile.handle}
            item={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.images[0]?.url ?? null,
              type: product.type,
              maxQuantity: product.stock,
            }}
            labels={{ add: t("Adicionar ao carrinho"), added: t("Adicionado!"), soldOut: t("Esgotado"), quantity: t("Quantidade") }}
            buttonClassName={`${radius} ${theme.classes.linkCard} ${theme.classes.linkCardHover}`}
            inputClassName="border border-current/20 bg-transparent"
          />

          {product.type !== "PHYSICAL" && (
            <p className={`text-sm ${theme.classes.bio}`}>
              {product.type === "DIGITAL"
                ? t("Entrega digital após a confirmação do pagamento.")
                : t("Serviço combinado com o vendedor após o pedido.")}
            </p>
          )}

          {product.description && (
            <section className="space-y-2">
              <h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.classes.bio}`}>{t("Descrição")}</h2>
              <p className="whitespace-pre-line text-sm leading-6">{product.description}</p>
            </section>
          )}

          {store.returnPolicy && (
            <details className="text-sm">
              <summary className={`cursor-pointer font-semibold ${theme.classes.bio}`}>{t("Trocas e devoluções")}</summary>
              <p className="mt-2 whitespace-pre-line leading-6">{store.returnPolicy}</p>
            </details>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
