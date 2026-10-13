import { describe, it, expect } from "vitest";
import { calculateCtr } from "@/lib/profiles/analytics";

describe("Profile Analytics Calculations", () => {
  it("calculates CTR correctly for various click and visit numbers", () => {
    expect(calculateCtr(10, 100)).toBe(10.0);
    expect(calculateCtr(25, 200)).toBe(12.5);
    expect(calculateCtr(1, 3)).toBe(33.3);
    expect(calculateCtr(0, 50)).toBe(0);
  });

  it("handles zero or negative visits safely without NaN / division by zero", () => {
    expect(calculateCtr(10, 0)).toBe(0);
    expect(calculateCtr(0, 0)).toBe(0);
    expect(calculateCtr(5, -10)).toBe(0);
  });
});
