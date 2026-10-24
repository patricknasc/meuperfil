import { beforeEach, describe, expect, it, vi } from "vitest";
const { db } = vi.hoisted(() => ({ db: { upsert: vi.fn(), findMany: vi.fn() } }));
vi.mock("@/lib/db/client", () => ({ prisma: { betaWaitlistEntry: db } }));
import { saveBetaWaitlistEntry, readBetaWaitlistEntries } from "@/lib/beta/storage";
describe("persistent beta storage", () => {
  beforeEach(() => { vi.resetAllMocks(); db.upsert.mockResolvedValue({ id: "existing" }); });
  it("normalizes email and deduplicates at the database boundary", async () => {
    await saveBetaWaitlistEntry({ name: "Ana", email: " ANA@EXAMPLE.COM ", source: "landing-page" });
    expect(db.upsert).toHaveBeenCalledWith({ where: { email: "ana@example.com" }, create: { id: expect.any(String), name: "Ana", email: "ana@example.com", source: "landing-page" }, update: { email: "ana@example.com" } });
  });
  it("propagates storage errors instead of reporting a successful registration", async () => {
    db.upsert.mockRejectedValue(new Error("db unavailable"));
    await expect(saveBetaWaitlistEntry({ name: "Ana", email: "ana@example.com", source: "landing-page" })).rejects.toThrow("db unavailable");
  });
  it("reads durable records", async () => {
    db.findMany.mockResolvedValue([{ email: "ana@example.com" }]);
    expect(await readBetaWaitlistEntries()).toEqual([{ email: "ana@example.com" }]);
  });
});
