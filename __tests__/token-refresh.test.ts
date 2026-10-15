import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  instagramAccount: { findMany: vi.fn(), update: vi.fn() },
  operationalEvent: { create: vi.fn() },
}));
const refreshLongLivedToken = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/meta/client", () => ({ refreshLongLivedToken }));
vi.mock("@/lib/meta/oauth", () => ({
  decryptToken: (v: string) => `plain:${v}`,
  encryptToken: (v: string) => `enc:${v}`,
}));

import { REFRESH_WITHIN_DAYS, refreshExpiringInstagramTokens } from "@/lib/meta/token-refresh";

const NOW = new Date("2026-10-15T12:00:00Z");

describe("refreshExpiringInstagramTokens", () => {
  beforeEach(() => vi.clearAllMocks());

  it("only selects tokens expiring within the refresh window", async () => {
    mockPrisma.instagramAccount.findMany.mockResolvedValue([]);
    await refreshExpiringInstagramTokens(NOW);
    const cutoff = mockPrisma.instagramAccount.findMany.mock.calls[0][0].where.tokenExpiresAt.lte as Date;
    expect(cutoff.getTime() - NOW.getTime()).toBe(REFRESH_WITHIN_DAYS * 86_400_000);
  });

  it("stores the refreshed token and new expiry", async () => {
    mockPrisma.instagramAccount.findMany.mockResolvedValue([
      { id: "a1", workspaceId: "w1", username: "ana", accessToken: "old", tokenExpiresAt: new Date("2026-11-01") },
    ]);
    refreshLongLivedToken.mockResolvedValue({ accessToken: "new", expiresIn: 5_184_000 });

    const results = await refreshExpiringInstagramTokens(NOW);

    expect(refreshLongLivedToken).toHaveBeenCalledWith("plain:old");
    expect(mockPrisma.instagramAccount.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { accessToken: "enc:new", tokenExpiresAt: new Date(NOW.getTime() + 5_184_000_000) },
    });
    expect(results).toEqual([{ instagramAccountId: "a1", username: "ana", status: "refreshed" }]);
  });

  it("logs failures and keeps going with other accounts", async () => {
    mockPrisma.instagramAccount.findMany.mockResolvedValue([
      { id: "a1", workspaceId: "w1", username: "ana", accessToken: "x", tokenExpiresAt: new Date("2026-10-01") },
      { id: "a2", workspaceId: "w2", username: "bia", accessToken: "y", tokenExpiresAt: new Date("2026-11-01") },
    ]);
    refreshLongLivedToken.mockRejectedValueOnce(new Error("revoked")).mockResolvedValueOnce({ accessToken: "n", expiresIn: 100 });

    const results = await refreshExpiringInstagramTokens(NOW);

    expect(results.map((r) => r.status)).toEqual(["failed", "refreshed"]);
    const event = mockPrisma.operationalEvent.create.mock.calls[0][0].data;
    expect(event.message).toContain("expired; reconnect");
  });
});
