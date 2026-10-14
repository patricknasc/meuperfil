/**
 * Turns request headers into anonymous visit context: approximate location
 * (Vercel geo headers), UTM tags, device/app and traffic source.
 * Nothing here identifies a person.
 */

type HeaderSource = { get(name: string): string | null };

export interface VisitContext {
  country: string | null;
  region: string | null;
  city: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

function clean(value: string | null | undefined, max = 100): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function geoFromHeaders(headers: HeaderSource): Pick<VisitContext, "country" | "region" | "city"> {
  let city = headers.get("x-vercel-ip-city");
  try {
    city = city ? decodeURIComponent(city) : null;
  } catch {
    // Keep the raw value if it is not URI-encoded.
  }
  return {
    country: clean(headers.get("x-vercel-ip-country"), 2)?.toUpperCase() ?? null,
    region: clean(headers.get("x-vercel-ip-country-region"), 10),
    city: clean(city),
  };
}

export function utmFromParams(params: URLSearchParams | Record<string, string | string[] | undefined>) {
  const read = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return clean(Array.isArray(value) ? value[0] : value)?.toLowerCase() ?? null;
  };
  return { utmSource: read("utm_source"), utmMedium: read("utm_medium"), utmCampaign: read("utm_campaign") };
}

/** UTMs of the page the click came from (the referer is our own profile URL). */
export function utmFromReferrer(referrer: string | null | undefined) {
  try {
    return utmFromParams(new URL(referrer ?? "").searchParams);
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}

export type DeviceType = "mobile" | "tablet" | "desktop" | "bot";

export function parseUserAgent(ua: string | null | undefined) {
  const value = ua ?? "";
  const device: DeviceType = /bot|crawler|spider|preview|facebookexternalhit|whatsapp\//i.test(value)
    ? "bot"
    : /ipad|tablet|kindle|(android(?!.*mobile))/i.test(value)
      ? "tablet"
      : /mobi|iphone|android/i.test(value)
        ? "mobile"
        : "desktop";

  const app = /instagram/i.test(value)
    ? "Instagram"
    : /bytedance|musical_ly|tiktok/i.test(value)
      ? "TikTok"
      : /fban|fbav|fb_iab/i.test(value)
        ? "Facebook"
        : /linkedinapp/i.test(value)
          ? "LinkedIn"
          : null;

  const browser = app
    ? `${app} (app)`
    : /edg\//i.test(value)
      ? "Edge"
      : /opr\/|opera/i.test(value)
        ? "Opera"
        : /samsungbrowser/i.test(value)
          ? "Samsung Internet"
          : /chrome|crios/i.test(value)
            ? "Chrome"
            : /firefox|fxios/i.test(value)
              ? "Firefox"
              : /safari/i.test(value)
                ? "Safari"
                : "Outro";

  const os = /iphone|ipad|ios/i.test(value)
    ? "iOS"
    : /android/i.test(value)
      ? "Android"
      : /windows/i.test(value)
        ? "Windows"
        : /mac os/i.test(value)
          ? "macOS"
          : /linux/i.test(value)
            ? "Linux"
            : "Outro";

  return { device, browser, os, app };
}

const SOURCES: Array<[RegExp, string]> = [
  [/instagram/i, "Instagram"],
  [/tiktok/i, "TikTok"],
  [/(^|\.)(facebook|fb)\.(com|me)|^l\.facebook/i, "Facebook"],
  [/whatsapp|wa\.me/i, "WhatsApp"],
  [/youtube|youtu\.be/i, "YouTube"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/i, "X"],
  [/linkedin|lnkd\.in/i, "LinkedIn"],
  [/google\./i, "Google"],
  [/bing\.com|duckduckgo|yahoo\./i, "Busca"],
  [/t\.me|telegram/i, "Telegram"],
];

/** Where the visit came from: UTM source, in-app browser, or referrer host. */
export function classifySource(input: { utmSource?: string | null; referrer?: string | null; userAgent?: string | null }) {
  if (input.utmSource) {
    const match = SOURCES.find(([pattern]) => pattern.test(input.utmSource!));
    return match ? match[1] : input.utmSource;
  }
  const app = parseUserAgent(input.userAgent).app;
  if (app) return app;
  if (!input.referrer) return "Direto";
  try {
    const host = new URL(input.referrer).hostname.replace(/^www\./, "");
    const match = SOURCES.find(([pattern]) => pattern.test(host));
    return match ? match[1] : host;
  } catch {
    return "Direto";
  }
}
