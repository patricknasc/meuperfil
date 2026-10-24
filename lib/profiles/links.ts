import { getSocialPlatform } from "./social-platforms";

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
  | "invalid_email"
  | "wrong_site";

export type LinkResult =
  | {
      ok: true;
      url: string;
      /** Set when a WhatsApp number without "+" was assumed to be Brazilian. */
      assumedBrazil?: boolean;
    }
  | { ok: false; error: LinkError };

const HANDLE = /^[A-Za-z0-9._-]{1,60}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const assumedBrazil = !value.startsWith("+") && (digits.length === 10 || digits.length === 11);
  if (assumedBrazil) digits = `55${digits}`;
  if (digits.length < 10 || digits.length > 15) return { ok: false, error: "invalid_phone" };
  return assumedBrazil ? { ok: true, url: `https://wa.me/${digits}`, assumedBrazil } : { ok: true, url: `https://wa.me/${digits}` };
}

export function normalizeEmail(input: string): LinkResult {
  const value = input.trim().replace(/^mailto:/i, "");
  if (!value) return { ok: false, error: "empty" };
  return EMAIL.test(value) ? { ok: true, url: `mailto:${value}` } : { ok: false, error: "invalid_email" };
}

export function normalizeSocialLink(platformId: string, input: string): LinkResult {
  const value = input.trim();
  if (!value) return { ok: false, error: "empty" };

  const platform = getSocialPlatform(platformId);
  switch (platform.kind) {
    case "phone":
      return normalizeWhatsApp(value);
    case "email":
      return normalizeEmail(value);
    case "web":
      return normalizeWebUrl(value);
  }

  const hosts = platform.hosts ?? [];
  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:/i.test(value) || /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}\//i.test(value);
  if (looksLikeUrl || platform.kind === "site-url" || !platform.build) {
    const web = normalizeWebUrl(value);
    if (!web.ok) return web;
    return matchesHost(new URL(web.url).hostname, hosts) ? web : { ok: false, error: "wrong_site" };
  }

  const handle = value.replace(/^@+/, "");
  if (!HANDLE.test(handle)) return { ok: false, error: "invalid_handle" };
  return { ok: true, url: platform.build(handle) };
}

/** Safe destinations for social links: http(s) or a single mailto address. */
export function isSafeSocialUrl(url: string): boolean {
  if (/^mailto:/i.test(url)) return EMAIL.test(url.slice(7));
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
