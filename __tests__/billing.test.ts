import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getEffectivePlan,
  getPlanForPriceId,
  hasPaidAccess,
  PLAN_LIMITS,
} from "../lib/billing/plans";

beforeEach(() => {
  vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
  vi.stubEnv("STRIPE_PRICE_AGENCY", "price_agency");
});

describe("billing plan helpers", () => {
  it("maps Stripe price IDs to plans", () => {
    expect(getPlanForPriceId("price_pro")).toBe("PRO");
    expect(getPlanForPriceId("price_agency")).toBe("AGENCY");
    expect(getPlanForPriceId("unknown")).toBe("FREE");
  });

  it("falls back paid plans without active billing to FREE", () => {
    expect(getEffectivePlan("PRO", "ACTIVE")).toBe("PRO");
    expect(getEffectivePlan("AGENCY", "TRIALING")).toBe("AGENCY");
    expect(getEffectivePlan("PRO", "PAST_DUE")).toBe("FREE");
    expect(hasPaidAccess("UNPAID")).toBe(false);
  });

  it("defines B2B MVP plan limits", () => {
    expect(PLAN_LIMITS.FREE).toEqual({
      maxAutomations: 1,
      maxDMsPerMonth: 100,
      maxInstagramAccounts: 1,
      maxWorkspaceMembers: 1,
      maxProfiles: 1,
      maxBlocksPerProfile: 5,
      maxScheduledPostsPerMonth: 5,
    });
    expect(PLAN_LIMITS.PRO.maxAutomations).toBe(10);
    expect(PLAN_LIMITS.PRO.maxInstagramAccounts).toBe(1);
    expect(PLAN_LIMITS.PRO.maxProfiles).toBe(3);
    expect(PLAN_LIMITS.PRO.maxBlocksPerProfile).toBe(25);
    expect(PLAN_LIMITS.PRO.maxScheduledPostsPerMonth).toBe(60);
    expect(PLAN_LIMITS.AGENCY.maxInstagramAccounts).toBe(10);
    expect(PLAN_LIMITS.AGENCY.maxWorkspaceMembers).toBe(10);
    expect(PLAN_LIMITS.AGENCY.maxDMsPerMonth).toBe(10000);
    expect(PLAN_LIMITS.AGENCY.maxProfiles).toBe(20);
    expect(PLAN_LIMITS.AGENCY.maxBlocksPerProfile).toBe(100);
    expect(PLAN_LIMITS.AGENCY.maxScheduledPostsPerMonth).toBe(Number.POSITIVE_INFINITY);
  });
});
