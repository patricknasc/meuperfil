import { beforeEach, describe, expect, it, vi } from "vitest";
const { tx } = vi.hoisted(() => ({ tx: {
  automation: { findFirst: vi.fn() }, profile: { findFirst: vi.fn() },
  contact: { upsert: vi.fn(), findMany: vi.fn() }, leadInteraction: { upsert: vi.fn() },
} }));
vi.mock("@/lib/db/client", () => ({ prisma: { ...tx, $transaction: vi.fn((callback) => callback(tx)) } }));
import { captureLeadFromInteraction, listWorkspaceLeads } from "@/lib/crm";
const event = { workspaceId: "w1", source: "CAMPAIGN" as const, sourceId: "c1", interactionKey: "comment_1", instagramId: "person_1", instagramUsername: "Ana" };
describe("Persisted leads", () => {
  beforeEach(() => { vi.resetAllMocks(); tx.automation.findFirst.mockResolvedValue({ id: "c1" }); tx.contact.upsert.mockResolvedValue({ id: "contact_1" }); });
  it("reuses contact identity and event key for repeated webhooks", async () => {
    await captureLeadFromInteraction(event); await captureLeadFromInteraction(event);
    expect(tx.contact.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId_identityKey: { workspaceId: "w1", identityKey: "instagram:person_1" } }, update: { lastInteractionAt: expect.any(Date) } }));
    expect(tx.leadInteraction.upsert.mock.calls[0][0].where).toEqual(tx.leadInteraction.upsert.mock.calls[1][0].where);
    expect(tx.contact.upsert.mock.calls[0][0].update).not.toHaveProperty("status");
  });
  it("rejects cross-workspace campaign attribution", async () => {
    tx.automation.findFirst.mockResolvedValue(null);
    await expect(captureLeadFromInteraction(event)).rejects.toThrow("workspace");
    expect(tx.contact.upsert).not.toHaveBeenCalled();
  });
  it("rejects anonymous clicks as leads and normalizes email identities", async () => {
    await expect(captureLeadFromInteraction({ workspaceId: "w1", source: "MANUAL" })).rejects.toThrow();
    await captureLeadFromInteraction({ workspaceId: "w1", source: "MANUAL", email: " ANA@EXAMPLE.COM " });
    expect(tx.contact.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId_identityKey: { workspaceId: "w1", identityKey: "email:ana@example.com" } } }));
  });
  it("scopes search, status and campaign filters to the workspace", async () => {
    await listWorkspaceLeads("w1", { status: "QUALIFIED", search: "Ana", campaignId: "c1" });
    expect(tx.contact.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ workspaceId: "w1", status: "QUALIFIED", interactions: { some: { workspaceId: "w1", automationId: "c1" } } }) }));
  });
});
