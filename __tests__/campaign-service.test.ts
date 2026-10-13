import { beforeEach, describe, expect, it, vi } from "vitest";
const { tx } = vi.hoisted(() => ({ tx: { $queryRaw: vi.fn(), workspace: { findUniqueOrThrow: vi.fn() }, automation: { count: vi.fn(), create: vi.fn() }, instagramAccount: { findFirst: vi.fn() } } }));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: vi.fn((callback) => callback(tx)) } }));
import { createCampaign, CampaignLimitError } from "@/lib/campaigns/service";
const data = { workspaceId: "w1", instagramAccountId: "a1", name: "Test", postId: "p1", keywords: ["LINK"], dmMessage: "hello" };
describe("Campaign quota", () => {
  beforeEach(() => { vi.resetAllMocks(); tx.workspace.findUniqueOrThrow.mockResolvedValue({ plan: "FREE", subscriptionStatus: "NONE" }); tx.automation.count.mockResolvedValue(0); tx.instagramAccount.findFirst.mockResolvedValue({ id: "a1" }); });
  it("rejects a full plan before creating a scheduled or manual campaign", async () => {
    tx.automation.count.mockResolvedValue(1);
    await expect(createCampaign(data)).rejects.toBeInstanceOf(CampaignLimitError);
    expect(tx.automation.create).not.toHaveBeenCalled();
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.automation.count.mock.invocationCallOrder[0]);
  });
  it("rejects accounts outside the workspace", async () => {
    tx.instagramAccount.findFirst.mockResolvedValue(null);
    await expect(createCampaign(data)).rejects.toThrow("não pertence");
    expect(tx.automation.create).not.toHaveBeenCalled();
  });
});
