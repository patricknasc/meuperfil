import Image from "next/image";
import { profileTranslator } from "@/lib/i18n/profiles";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getPublicProfileByHandle, recordProfileVisit } from "@/lib/profiles/service";
import { getThemeConfig } from "@/lib/profiles/themes";
import { ProfileBlockType } from "@/app/generated/prisma/client";
import { hashClickIp } from "@/lib/tracking/server";

interface PageProps {
  params: Promise<{ lang: string; handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, handle } = await params;
  const t = profileTranslator(lang);
  const profile = await getPublicProfileByHandle(handle);

  if (!profile || !profile.isPublished) {
    return {
      title: `${t("Perfil não encontrado")} | meuperfil.me`,
      robots: { index: false, follow: false },
    };
  }

  const title = profile.seoTitle || `${profile.displayName} (@${profile.handle}) | meuperfil.me`;
  const description =
    profile.seoDescription ||
    profile.bio ||
    `${profile.displayName} — ${lang === "en" ? "Links, products and social networks" : lang === "es" ? "Enlaces, productos y redes sociales" : "Links, produtos e redes sociais"} | meuperfil.me`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://meuperfil.me/${profile.handle}`,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl, alt: profile.displayName }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { lang, handle } = await params;
  const t = profileTranslator(lang);
  const profile = await getPublicProfileByHandle(handle);

  if (!profile || !profile.isPublished) {
    notFound();
  }

  // Server-side visit tracking
  const headerList = await headers();
  const rawIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headerList.get("user-agent") || undefined;
  const referrer = headerList.get("referer") || undefined;
  const ipHash = hashClickIp(rawIp);

  await recordProfileVisit(profile.id, profile.workspaceId, {
    ipHash,
    userAgent,
    referrer,
  });

  const themeConfig = getThemeConfig(profile.theme);

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 ${themeConfig.classes.background} ${themeConfig.classes.container} selection:bg-indigo-500 selection:text-white transition-colors duration-300`}
    >
      <div className="w-full max-w-md mx-auto flex flex-col items-center pt-8 sm:pt-14 pb-12">
        {/* Profile Avatar & Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          {profile.avatarUrl ? (
            <Image unoptimized width={96} height={96}
              src={profile.avatarUrl}
              alt={profile.displayName}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 ${themeConfig.classes.avatarBorder} transition-all duration-300`}
            />
          ) : (
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl sm:text-4xl border-2 ${themeConfig.classes.avatarBorder}`}
            >
              {profile.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className={`text-xl sm:text-2xl ${themeConfig.classes.displayName}`}>
              {profile.displayName}
            </h1>
            <span
              className={`inline-block text-xs font-mono px-3 py-0.5 rounded-full mt-1.5 ${themeConfig.classes.handleBadge}`}
            >
              @{profile.handle}
            </span>
          </div>

          {profile.bio && (
            <p
              className={`text-sm max-w-sm leading-relaxed px-2 mt-1 ${themeConfig.classes.bio}`}
            >
              {profile.bio}
            </p>
          )}
        </div>

        {/* Blocks Container */}
        <div className="w-full space-y-3.5">
          {profile.blocks.map((block) => {
            if (block.type === ProfileBlockType.TEXT_DIVIDER) {
              return (
                <div key={block.id} className="py-2 text-center">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${themeConfig.classes.divider}`}
                  >
                    {block.title}
                  </span>
                </div>
              );
            }

            if (block.type === ProfileBlockType.SOCIAL_LINKS && block.config) {
              const config = block.config as { links?: Array<{ platform: string; url: string }> };
              const links = config.links || [];

              return (
                <div key={block.id} className="flex items-center justify-center gap-3 py-2 flex-wrap">
                  {links.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold ${themeConfig.classes.socialIconBg} ${themeConfig.classes.socialIconText} shadow-md transition-all hover:scale-110 active:scale-95`}
                      title={s.platform}
                    >
                      {s.platform.slice(0, 2).toUpperCase()}
                    </a>
                  ))}
                </div>
              );
            }

            // Standard LINK block with safe click redirect
            return (
              <a
                key={block.id}
                href={`/p/c/${block.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 ${themeConfig.classes.linkCard} ${themeConfig.classes.linkCardHover} group`}
              >
                {block.imageUrl && (
                  <Image unoptimized width={40} height={40}
                    src={block.imageUrl}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1 text-center">
                  <p className={`text-sm ${themeConfig.classes.linkTitle} truncate`}>
                    {block.title}
                  </p>
                  {block.description && (
                    <p className={`${themeConfig.classes.linkDescription} truncate mt-0.5`}>
                      {block.description}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Powered by meuperfil.me Footer Badge */}
      <footer className="pt-8 pb-4 text-center">
        <a
          href={`/${lang}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase opacity-75 hover:opacity-100 transition-opacity ${themeConfig.classes.footerText}`}
        >
          <span>{t("Criado com")}</span>
          <strong className="font-bold text-white">meuperfil.me</strong>
        </a>
      </footer>
    </main>
  );
}
