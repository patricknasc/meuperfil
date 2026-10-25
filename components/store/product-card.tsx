import Image from "next/image";
import Link from "next/link";
import type { ThemeConfig } from "@/lib/profiles/themes";
import type { PublicProduct } from "@/lib/store/service";
import { formatPrice } from "@/lib/store/money";
import { storeTranslator } from "@/lib/i18n/store";

interface ProductCardProps {
  product: PublicProduct;
  href: string;
  lang: string;
  theme: ThemeConfig;
}

export function ProductCard({ product, href, lang, theme }: ProductCardProps) {
  const t = storeTranslator(lang);
  const image = product.images[0];
  const soldOut = product.stock === 0;

  return (
    <Link
      href={href}
      className={`group flex min-w-0 flex-col overflow-hidden ${theme.classes.linkRadius ?? "rounded-2xl"} ${theme.classes.linkCard}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
        {image ? (
          <Image
            unoptimized
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            src={image.url}
            alt={image.alt || product.name}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center text-3xl font-black opacity-40`}>
            {product.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
            {t("Esgotado")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className={`line-clamp-2 text-sm ${theme.classes.linkTitle}`}>{product.name}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <span className={`text-sm font-bold ${theme.classes.linkTitle}`}>{formatPrice(product.priceCents, lang)}</span>
          {product.compareAtCents && (
            <span className={`text-xs line-through ${theme.classes.linkDescription}`}>
              {formatPrice(product.compareAtCents, lang)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
