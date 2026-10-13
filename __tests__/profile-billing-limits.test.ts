import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, getEffectivePlan } from "@/lib/billing/plans";

describe("Profile Billing Limits & Plan Capabilities", () => {
  it("enforces correct profile quotas across tiers", () => {
    expect(PLAN_LIMITS.FREE.maxProfiles).toBe(1);
    expect(PLAN_LIMITS.PRO.maxProfiles).toBe(3);
    expect(PLAN_LIMITS.AGENCY.maxProfiles).toBe(20);
  });

  it("enforces correct block quotas per profile across tiers", () => {
    expect(PLAN_LIMITS.FREE.maxBlocksPerProfile).toBe(5);
    expect(PLAN_LIMITS.PRO.maxBlocksPerProfile).toBe(25);
    expect(PLAN_LIMITS.AGENCY.maxBlocksPerProfile).toBe(100);
  });

  it("downgrades effective plan to FREE if subscription is unpaid or canceled", () => {
    expect(getEffectivePlan("PRO", "ACTIVE")).toBe("PRO");
    expect(getEffectivePlan("PRO", "TRIALING")).toBe("PRO");
    expect(getEffectivePlan("PRO", "CANCELED")).toBe("FREE");
    expect(getEffectivePlan("PRO", "PAST_DUE")).toBe("FREE");
    expect(getEffectivePlan("AGENCY", "UNPAID")).toBe("FREE");
  });
});
