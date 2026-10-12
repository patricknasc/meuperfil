import { describe, expect, it } from "vitest";
import {
  betaWaitlistSchema,
  dedupeWaitlistEntries,
  normalizeBetaWaitlistEntry,
} from "../lib/beta/waitlist";

describe("beta waitlist", () => {
  it("accepts a valid beta application", () => {
    const parsed = betaWaitlistSchema.parse({
      name: "Ana Silva",
      email: "ana@studio.com",
      company: "Studio North",
      goal: "Agency rollout for 3 client accounts",
      source: "landing-page",
    });

    expect(parsed.email).toBe("ana@studio.com");
    expect(parsed.company).toBe("Studio North");
  });

  it("rejects invalid email input", () => {
    expect(() =>
      betaWaitlistSchema.parse({
        name: "Broken User",
        email: "not-an-email",
      })
    ).toThrow();
  });

  it("normalizes and deduplicates waitlist entries", () => {
    const entries = [
      normalizeBetaWaitlistEntry({
        name: " Ana ",
        email: "ana@studio.com",
        company: " Studio North ",
      }),
      normalizeBetaWaitlistEntry({
        name: "ana",
        email: "ANA@STUDIO.COM",
        company: "Studio North",
      }),
      normalizeBetaWaitlistEntry({
        name: "Bruno",
        email: "bruno@studio.com",
        company: "Studio East",
      }),
    ];

    expect(dedupeWaitlistEntries(entries)).toHaveLength(2);
    expect(dedupeWaitlistEntries(entries)[0].email).toBe("ana@studio.com");
  });
});
