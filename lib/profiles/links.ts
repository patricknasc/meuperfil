/**
 * Normalizes what people type into link fields so they do not need to know
 * URL syntax: "www.site.com" becomes "https://www.site.com", "@user" becomes
 * the profile URL, and a phone number becomes a wa.me link.
 */

export type LinkError =
  | "empty"
  | "invalid_url"
  | "invalid_handle"
  | "invalid_phone"
  | "wrong_site";

export type LinkResult = { ok: true; url: string } | { ok: false; error: LinkError };

export type SocialPlatform =
  | "instagram"
  | "whatsapp"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "github"
  | "facebook"
  | "telegram"
  | "spotify"
  | "website";

const HANDLE = /^[A-Za-z0-9._-]{1,60}$/;

/** Host suffixes accepted when the person pastes a full profile URL. */
const PROFILE_SITES: Partial<Record<SocialPlatform, { hosts: string[]; build: (handle: string) => string }>> = {
  instagram: { hosts: ["instagram.com"], build: (h) => `https://instagram.com/${h}` },
  tiktok: { hosts: ["tiktok.com"], build: (h) => `https://www.tiktok.com/@${h}` },
  youtube: { hosts: ["youtube.com", "youtu.be"], build: (h) => `https://www.youtube.com/@${h}` },
  twitter: { hosts: ["x.com", "twitter.com"], build: (h) => `https://x.com/${h}` },
  linkedin: { hosts: ["linkedin.com"], build: (h) => `https://www.linkedin.com/in/${h}` },
  github: { hosts: ["github.com"], build: (h) => `https://github.com/${h}` },
  facebook: { hosts: ["facebook.com", "fb.com"], build: (h) => `https://facebook.com/${h}` },
  telegram: { hosts: ["t.me", "telegram.me"], build: (h) => `https://t.me/${h}` },
  spotify: { hosts: ["spotify.com"], build: () => "" },
};

function matchesHost(hostname: string, hosts: string[]) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Accepts "site.com", "www.site.com/path" or a full http(s) URL. */
export function normalizeWebUrl(input: string): LinkResult {
  const value = input.trim();
  if (!value) return { ok: false, error: "empty" };
  if (/\s/.test(value)) return { ok: false, error: "invalid_url" };

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  let parsed: URL;
  try {
    parsed = new URL(hasScheme ? value : `https://${value.replace(/^\/+/, "")}`);
  } catch {
    return { ok: false, error: "invalid_url" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "invalid_url" };
  }
  const labels = parsed.hostname.split(".");
  if (labels.length < 2 || labels.some((l) => !l) || labels[labels.length - 1].length < 2) {
    return { ok: false, error: "invalid_url" };
  }

  const url = parsed.pathname === "/" && !parsed.search && !parsed.hash ? parsed.origin : parsed.href;
  return { ok: true, url };
}

/**
 * WhatsApp: digits with optional "+", spaces, dots, dashes and parentheses.
 * Numbers without a country code and with 10–11 digits are treated as
 * Brazilian (DDD + number) and get the 55 prefix.
 */
export function normalizeWhatsApp(input: string): LinkResult {
  const value = input.trim();
  if (!value) return { ok: false, error: "empty" };

  if (/wa\.me|whatsapp\.com/i.test(value)) {
    const web = normalizeWebUrl(value);
    return web.ok ? web : { ok: false, error: "invalid_phone" };
  }

  if (!/^\+?[\d\s().-]+$/.test(value)) return { ok: false, error: "invalid_phone" };
  let digits = value.replace(/\D/g, "");
  if (!value.startsWith("+") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  if (digits.length < 10 || digits.length > 15) return { ok: false, error: "invalid_phone" };
  return { ok: true, url: `https://wa.me/${digits}` };
}

export function normalizeSocialLink(platform: string, input: string): LinkResult {
  const value = input.trim();
  if (!value) return { ok: false, error: "empty" };

  if (platform === "whatsapp") return normalizeWhatsApp(value);
  if (platform === "website") return normalizeWebUrl(value);

  const site = PROFILE_SITES[platform as SocialPlatform];
  if (!site) return normalizeWebUrl(value);

  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:/i.test(value) || /^(www\.)?[a-z0-9-]+\.[a-z]{2,}\//i.test(value);
  if (looksLikeUrl || platform === "spotify") {
    const web = normalizeWebUrl(value);
    if (!web.ok) return web;
    return matchesHost(new URL(web.url).hostname, site.hosts) ? web : { ok: false, error: "wrong_site" };
  }

  const handle = value.replace(/^@+/, "");
  if (!HANDLE.test(handle)) return { ok: false, error: "invalid_handle" };
  return { ok: true, url: site.build(handle) };
}
