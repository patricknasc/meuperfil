import { describe, expect, it } from "vitest";
import { normalizeSocialLink, normalizeWebUrl, normalizeWhatsApp } from "@/lib/profiles/links";

describe("normalizeWebUrl", () => {
  it("adds https to bare domains", () => {
    expect(normalizeWebUrl("www.google.com")).toEqual({ ok: true, url: "https://www.google.com" });
    expect(normalizeWebUrl("loja.com.br/oferta?x=1")).toEqual({ ok: true, url: "https://loja.com.br/oferta?x=1" });
  });

  it("keeps explicit http(s) URLs", () => {
    expect(normalizeWebUrl("http://site.com/a")).toEqual({ ok: true, url: "http://site.com/a" });
  });

  it("rejects non-web schemes, spaces and hosts without a domain", () => {
    expect(normalizeWebUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeWebUrl("meu site.com").ok).toBe(false);
    expect(normalizeWebUrl("localhost").ok).toBe(false);
    expect(normalizeWebUrl("google").ok).toBe(false);
    expect(normalizeWebUrl("  ")).toEqual({ ok: false, error: "empty" });
  });
});

describe("normalizeWhatsApp", () => {
  it("builds wa.me links from phone numbers", () => {
    expect(normalizeWhatsApp("+55 (11) 99999-8888")).toEqual({ ok: true, url: "https://wa.me/5511999998888" });
    expect(normalizeWhatsApp("+1 415 555 0100")).toEqual({ ok: true, url: "https://wa.me/14155550100" });
  });

  it("assumes Brazil for 10–11 digit numbers without country code", () => {
    expect(normalizeWhatsApp("11 99999-8888")).toEqual({ ok: true, url: "https://wa.me/5511999998888" });
  });

  it("accepts existing wa.me links", () => {
    expect(normalizeWhatsApp("wa.me/5511999998888")).toEqual({ ok: true, url: "https://wa.me/5511999998888" });
  });

  it("rejects letters and wrong lengths", () => {
    expect(normalizeWhatsApp("+66934178294x5")).toEqual({ ok: false, error: "invalid_phone" });
    expect(normalizeWhatsApp("patricknasc")).toEqual({ ok: false, error: "invalid_phone" });
    expect(normalizeWhatsApp("12345").ok).toBe(false);
  });
});

describe("normalizeSocialLink", () => {
  it("turns @handles into profile URLs", () => {
    expect(normalizeSocialLink("instagram", "@patricknasc")).toEqual({ ok: true, url: "https://instagram.com/patricknasc" });
    expect(normalizeSocialLink("tiktok", "patricknasc")).toEqual({ ok: true, url: "https://www.tiktok.com/@patricknasc" });
  });

  it("accepts full profile URLs only from the right site", () => {
    expect(normalizeSocialLink("instagram", "https://instagram.com/patricknasc")).toEqual({
      ok: true,
      url: "https://instagram.com/patricknasc",
    });
    expect(normalizeSocialLink("instagram", "https://tiktok.com/@x")).toEqual({ ok: false, error: "wrong_site" });
  });

  it("rejects handles with invalid characters", () => {
    expect(normalizeSocialLink("instagram", "meu perfil!")).toEqual({ ok: false, error: "invalid_handle" });
  });
});

describe("toHandleCandidate", () => {
  it("strips accents, symbols and edge punctuation", async () => {
    const { toHandleCandidate } = await import("@/lib/profiles/handle-suggestion");
    expect(toHandleCandidate("Patrick.Nascimento")).toBe("patrick.nascimento");
    expect(toHandleCandidate("joão silva!")).toBe("joaosilva");
    expect(toHandleCandidate("_loja.da.ana_")).toBe("loja.da.ana");
  });
});
