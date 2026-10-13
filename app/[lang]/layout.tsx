import type { Metadata } from "next";
import "../globals.css";
import { locales, hasLocale, type Locale } from "./dictionaries";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  title: "meuperfil.me — O Link na Bio definitivo com Automação Instagram",
  description:
    "Crie uma bio linda e de alta conversão integrada com automação de direct no Instagram. Transforme seguidores e comentários em clientes.",
  keywords: [
    "link na bio",
    "linktree alternative",
    "instagram comment to dm",
    "instagram automation",
    "meuperfil",
    "bio link",
    "conversao instagram",
  ],
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : "pt";

  return (
    <html lang={locale} className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
