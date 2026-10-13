import { describe, it, expect } from "vitest";
import {
  isValidHandle,
  sanitizeHandle,
  isReservedHandle,
  isValidDestinationUrl,
  createProfileSchema,
  createBlockSchema,
} from "@/lib/profiles/validation";
import { ProfileTheme, ProfileBlockType } from "@/app/generated/prisma/client";

describe("Profile Handle Validation", () => {
  it("sanitizes handle properly", () => {
    expect(sanitizeHandle("@pedro_silva")).toBe("pedro_silva");
    expect(sanitizeHandle("@@Ana.Design  ")).toBe("ana.design");
    expect(sanitizeHandle("Lucas-Dev")).toBe("lucas-dev");
  });

  it("validates correct handles", () => {
    expect(isValidHandle("pedro")).toBe(true);
    expect(isValidHandle("lucas_dev")).toBe(true);
    expect(isValidHandle("studio.criativo")).toBe(true);
    expect(isValidHandle("agencia-123")).toBe(true);
  });

  it("rejects handles that are too short or too long", () => {
    expect(isValidHandle("ab")).toBe(false);
    expect(isValidHandle("a".repeat(31))).toBe(false);
  });

  it("rejects handles starting or ending with special characters", () => {
    expect(isValidHandle("_pedro")).toBe(false);
    expect(isValidHandle("pedro_")).toBe(false);
    expect(isValidHandle("-pedro")).toBe(false);
    expect(isValidHandle(".pedro")).toBe(false);
  });

  it("rejects reserved system handles", () => {
    expect(isReservedHandle("admin")).toBe(true);
    expect(isReservedHandle("dashboard")).toBe(true);
    expect(isReservedHandle("api")).toBe(true);
    expect(isReservedHandle("login")).toBe(true);
    expect(isReservedHandle("meuperfil")).toBe(true);
    expect(isValidHandle("admin")).toBe(false);
    expect(isValidHandle("dashboard")).toBe(false);
  });
});

describe("Destination URL Security", () => {
  it("allows valid https and http URLs", () => {
    expect(isValidDestinationUrl("https://meusite.com.br")).toBe(true);
    expect(isValidDestinationUrl("http://localhost:3000/teste")).toBe(true);
    expect(isValidDestinationUrl("https://wa.me/5511999999999")).toBe(true);
  });

  it("rejects unsafe and non-http protocols (open redirect / XSS protection)", () => {
    expect(isValidDestinationUrl("javascript:alert(1)")).toBe(false);
    expect(isValidDestinationUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
    expect(isValidDestinationUrl("file:///etc/passwd")).toBe(false);
    expect(isValidDestinationUrl("ftp://server.com")).toBe(false);
    expect(isValidDestinationUrl("invalid-url-string")).toBe(false);
  });
});

describe("Zod Profile & Block Schemas", () => {
  it("validates correct profile creation payload", () => {
    const valid = createProfileSchema.parse({
      handle: "dev_criador",
      displayName: "Dev Criador",
      bio: "Programação e tech",
      theme: ProfileTheme.NEON_CYAN,
    });
    expect(valid.handle).toBe("dev_criador");
    expect(valid.displayName).toBe("Dev Criador");
    expect(valid.theme).toBe("NEON_CYAN");
  });

  it("fails profile creation with invalid handle", () => {
    expect(() =>
      createProfileSchema.parse({
        handle: "admin",
        displayName: "Admin",
      })
    ).toThrow();
  });

  it("validates block creation payload with safe URL", () => {
    const validBlock = createBlockSchema.parse({
      type: ProfileBlockType.LINK,
      title: "Meu Curso Online",
      url: "https://hotmart.com/curso",
      description: "Aprenda Next.js e Tailwind",
    });
    expect(validBlock.title).toBe("Meu Curso Online");
    expect(validBlock.type).toBe("LINK");
  });

  it("rejects block with unsafe URL protocol", () => {
    expect(() =>
      createBlockSchema.parse({
        type: ProfileBlockType.LINK,
        title: "Malicious Link",
        url: "javascript:evil()",
      })
    ).toThrow();
  });
});
