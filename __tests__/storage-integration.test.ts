import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
// Never put test posts on a live worker queue.
vi.mock("@/lib/queue/client", () => ({ getPostPublishingQueue: () => ({ getJob: async () => null, add: async () => undefined }) }));
import { prisma } from "@/lib/db/client";
import { createCampaign } from "@/lib/campaigns/service";
import { captureLeadFromInteraction, listWorkspaceLeads } from "@/lib/crm";
import { createScheduledPost, triggerInstantPublish } from "@/lib/scheduler/service";
import { saveBetaWaitlistEntry } from "@/lib/beta/storage";

const enabled = process.env.RUN_DB_INTEGRATION === "1";
describe.skipIf(!enabled)("Local database integration", () => {
  let userId: string, workspaceId: string, accountId: string, campaignId: string;
  const email = `integration-${randomUUID()}@example.com`;
  beforeAll(async () => {
    if (!["localhost", "127.0.0.1", "::1"].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error("Integration tests require a local database");
    const user = await prisma.user.create({ data: { email } }); userId = user.id;
    const workspace = await prisma.workspace.create({ data: { name: "Temporary integration test", ownerId: userId } }); workspaceId = workspace.id;
    const account = await prisma.instagramAccount.create({ data: { workspaceId, instagramId: randomUUID(), username: "integration-test", accessToken: "test-only" } }); accountId = account.id;
  });
  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await prisma.betaWaitlistEntry.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });
  it("serializes concurrent campaign creation at a one-campaign quota", async () => {
    const data = { workspaceId, instagramAccountId: accountId, name: "Test", postId: "test-media", keywords: ["LINK"], dmMessage: "Test" };
    const results = await Promise.allSettled([createCampaign(data), createCampaign(data)]);
    expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    const successful = results.find((item) => item.status === "fulfilled");
    if (successful?.status === "fulfilled") campaignId = successful.value.id;
    expect(await prisma.automation.count({ where: { workspaceId } })).toBe(1);
  });
  it("keeps one lead and one interaction across duplicate and concurrent events", async () => {
    const input = { workspaceId, source: "CAMPAIGN" as const, sourceId: campaignId, interactionKey: "comment-test", instagramId: "person-test" };
    await Promise.all([captureLeadFromInteraction(input), captureLeadFromInteraction(input)]);
    const contacts = await listWorkspaceLeads(workspaceId, { campaignId });
    expect(contacts).toHaveLength(1); expect(contacts[0].interactions).toHaveLength(1);
    expect(await listWorkspaceLeads("another-workspace")).toHaveLength(0);
  });
  it("never returns Instagram tokens when creating or updating posts", async () => {
    const post = await createScheduledPost(workspaceId, { instagramAccountId: accountId, platform: "INSTAGRAM", mediaType: "IMAGE", mediaUrls: ["https://example.com/photo.jpg"], publishNow: false, autoCampaignEnabled: false, autoCampaignKeywords: [] });
    expect(post.instagramAccount).not.toHaveProperty("accessToken");
    expect(post.queueVersion).toBe(0);
  });
  it("enforces post quotas concurrently and counts old drafts when promoted", async () => {
    const input = { instagramAccountId: accountId, platform: "INSTAGRAM" as const, mediaType: "IMAGE" as const, mediaUrls: ["https://example.com/photo.jpg"], publishNow: false, scheduledFor: new Date(Date.now() + 86400_000).toISOString(), autoCampaignEnabled: false, autoCampaignKeywords: [] };
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => createScheduledPost(workspaceId, input)));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(5);
    const draft = await prisma.scheduledPost.findFirstOrThrow({ where: { workspaceId, status: "DRAFT" } });
    await prisma.scheduledPost.update({ where: { id: draft.id }, data: { createdAt: new Date("2020-01-01") } });
    await expect(triggerInstantPublish(workspaceId, draft.id)).rejects.toThrow("Limite");
    await prisma.workspace.update({ where: { id: workspaceId }, data: { plan: "PRO", subscriptionStatus: "ACTIVE" } });
    await triggerInstantPublish(workspaceId, draft.id);
    const promoted = await prisma.scheduledPost.findUniqueOrThrow({ where: { id: draft.id } });
    expect(promoted.quotaCountedAt!.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });
  it("persists a single waitlist registration across repeated submissions", async () => {
    await Promise.all([saveBetaWaitlistEntry({ email, name: "Test", source: "landing-page" }), saveBetaWaitlistEntry({ email, name: "Test", source: "landing-page" })]);
    expect(await prisma.betaWaitlistEntry.count({ where: { email } })).toBe(1);
  });
});
