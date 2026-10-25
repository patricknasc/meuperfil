import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getThemeConfig } from "@/lib/profiles/themes";
import { storeTranslator } from "@/lib/i18n/store";
import { getPublicStoreByHandle } from "@/lib/store/service";
import { StoreShell } from "@/components/store/store-shell";
import { Checkout } from "@/components/store/checkout";

interface PageProps {
  params: Promise<{ lang: string; handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${storeTranslator(lang)("Carrinho")} | meuperfil.me`, robots: { index: false, follow: false } };
}

export default async function CartPage({ params }: PageProps) {
  const { lang, handle } = await params;
  const data = await getPublicStoreByHandle(handle);
  if (!data) notFound();

  const theme = getThemeConfig(data.profile.theme);
  return (
    <StoreShell lang={lang} profile={data.profile} storeName={data.store.name}>
      <Checkout
        lang={lang}
        handle={data.profile.handle}
        classes={{
          card: theme.classes.linkCard,
          cardHover: theme.classes.linkCardHover,
          title: theme.classes.displayName,
          muted: theme.classes.bio,
          radius: theme.classes.linkRadius ?? "rounded-2xl",
        }}
      />
    </StoreShell>
  );
}
