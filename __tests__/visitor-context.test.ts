import { describe, expect, it } from "vitest";
import { classifySource, geoFromHeaders, parseUserAgent, utmFromParams, utmFromReferrer } from "@/lib/tracking/visitor";

const IG_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 321.0.0.0";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

describe("visitor context", () => {
  it("reads Vercel geo headers and decodes the city", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "br",
      "x-vercel-ip-country-region": "SP",
      "x-vercel-ip-city": "S%C3%A3o%20Paulo",
    });
    expect(geoFromHeaders(headers)).toEqual({ country: "BR", region: "SP", city: "São Paulo" });
    expect(geoFromHeaders(new Headers())).toEqual({ country: null, region: null, city: null });
  });

  it("extracts UTMs from params and from the referring profile URL", () => {
    expect(utmFromParams({ utm_source: "Instagram", utm_campaign: "Black-Friday" })).toEqual({
      utmSource: "instagram",
      utmMedium: null,
      utmCampaign: "black-friday",
    });
    expect(utmFromReferrer("https://meuperfil.me/pt/ana?utm_source=tiktok&utm_medium=bio").utmSource).toBe("tiktok");
    expect(utmFromReferrer(null).utmSource).toBeNull();
  });

  it("detects device, OS and in-app browsers", () => {
    expect(parseUserAgent(IG_IPHONE)).toMatchObject({ device: "mobile", os: "iOS", app: "Instagram", browser: "Instagram (app)" });
    expect(parseUserAgent(CHROME_DESKTOP)).toMatchObject({ device: "desktop", os: "Windows", browser: "Chrome" });
    expect(parseUserAgent("WhatsApp/2.23").device).toBe("bot");
  });

  it("classifies the traffic source", () => {
    expect(classifySource({ utmSource: "instagram" })).toBe("Instagram");
    expect(classifySource({ userAgent: IG_IPHONE })).toBe("Instagram");
    expect(classifySource({ referrer: "https://www.google.com/" })).toBe("Google");
    expect(classifySource({ referrer: "https://l.facebook.com/x" })).toBe("Facebook");
    expect(classifySource({})).toBe("Direto");
    expect(classifySource({ referrer: "https://blog.exemplo.com/post" })).toBe("blog.exemplo.com");
  });
});
