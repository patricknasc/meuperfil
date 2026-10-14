import { BRAND_ICONS } from "./brand-icons";

/**
 * Social and channel links offered in the bio link "Redes sociais" block.
 *
 * kind decides what the person types:
 * - handle: "@user", "user" or the full profile URL (checked against hosts)
 * - site-url: a full link that must belong to one of hosts
 * - phone: a WhatsApp number
 * - email: an email address (stored as mailto:)
 * - web: any website
 */
export type SocialKind = "handle" | "site-url" | "phone" | "email" | "web";

export interface SocialPlatform {
  id: string;
  label: string;
  kind: SocialKind;
  hosts?: string[];
  build?: (handle: string) => string;
  /** Brand color used by the "brand" icon style. */
  hex: string;
  /** 24x24 icon path; stroke icons are drawn with an outline. */
  icon: { path: string; stroke?: boolean };
}

const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
// Heroicons outline (MIT): globe-alt, shopping-bag, envelope.
const GLOBE_PATH =
  "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418";
const SHOP_PATH =
  "M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z";
const MAIL_PATH =
  "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75";

function brand(id: keyof typeof BRAND_ICONS) {
  return { hex: BRAND_ICONS[id].hex, icon: { path: BRAND_ICONS[id].path } };
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: "instagram", label: "Instagram", kind: "handle", hosts: ["instagram.com"], build: (h) => `https://instagram.com/${h}`, ...brand("instagram") },
  { id: "whatsapp", label: "WhatsApp", kind: "phone", ...brand("whatsapp") },
  { id: "tiktok", label: "TikTok", kind: "handle", hosts: ["tiktok.com"], build: (h) => `https://www.tiktok.com/@${h}`, ...brand("tiktok") },
  { id: "youtube", label: "YouTube", kind: "handle", hosts: ["youtube.com", "youtu.be"], build: (h) => `https://www.youtube.com/@${h}`, ...brand("youtube") },
  { id: "website", label: "Site", kind: "web", hex: "#2563EB", icon: { path: GLOBE_PATH, stroke: true } },
  { id: "shop", label: "Loja", kind: "web", hex: "#F97316", icon: { path: SHOP_PATH, stroke: true } },
  { id: "facebook", label: "Facebook", kind: "handle", hosts: ["facebook.com", "fb.com"], build: (h) => `https://facebook.com/${h}`, ...brand("facebook") },
  { id: "twitter", label: "X", kind: "handle", hosts: ["x.com", "twitter.com"], build: (h) => `https://x.com/${h}`, ...brand("twitter") },
  { id: "linkedin", label: "LinkedIn", kind: "handle", hosts: ["linkedin.com"], build: (h) => `https://www.linkedin.com/in/${h}`, hex: "#0A66C2", icon: { path: LINKEDIN_PATH } },
  { id: "threads", label: "Threads", kind: "handle", hosts: ["threads.net", "threads.com"], build: (h) => `https://www.threads.net/@${h}`, ...brand("threads") },
  { id: "pinterest", label: "Pinterest", kind: "handle", hosts: ["pinterest.com", "pin.it"], build: (h) => `https://pinterest.com/${h}`, ...brand("pinterest") },
  { id: "telegram", label: "Telegram", kind: "handle", hosts: ["t.me", "telegram.me"], build: (h) => `https://t.me/${h}`, ...brand("telegram") },
  { id: "spotify", label: "Spotify", kind: "site-url", hosts: ["spotify.com"], ...brand("spotify") },
  { id: "twitch", label: "Twitch", kind: "handle", hosts: ["twitch.tv"], build: (h) => `https://www.twitch.tv/${h}`, ...brand("twitch") },
  { id: "discord", label: "Discord", kind: "site-url", hosts: ["discord.gg", "discord.com"], ...brand("discord") },
  { id: "github", label: "GitHub", kind: "handle", hosts: ["github.com"], build: (h) => `https://github.com/${h}`, ...brand("github") },
  { id: "shopee", label: "Shopee", kind: "site-url", hosts: ["shopee.com.br", "shopee.com"], ...brand("shopee") },
  { id: "email", label: "E-mail", kind: "email", hex: "#64748B", icon: { path: MAIL_PATH, stroke: true } },
];

export const SOCIAL_PLATFORM_IDS = SOCIAL_PLATFORMS.map((p) => p.id) as [string, ...string[]];

export function getSocialPlatform(id: string): SocialPlatform {
  return SOCIAL_PLATFORMS.find((p) => p.id === id) ?? SOCIAL_PLATFORMS.find((p) => p.id === "website")!;
}
