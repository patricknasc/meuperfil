import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnrecoverableError, type Job } from "bullmq";
const { db, publish, createCampaign } = vi.hoisted(() => ({
  db: { scheduledPost: { updateMany: vi.fn(), findFirstOrThrow: vi.fn(), update: vi.fn(), findMany: vi.fn() }, operationalEvent: { create: vi.fn() } },
  publish: vi.fn(), createCampaign: vi.fn(),
}));
vi.mock("@/lib/db/client", () => ({ prisma: db }));
vi.mock("@/lib/meta/publisher", () => ({ publishToInstagram: publish }));
vi.mock("@/lib/meta/oauth", () => ({ decryptToken: () => "token" }));
vi.mock("@/lib/campaigns/service", () => ({ createCampaign }));
vi.mock("@/lib/scheduler/service", () => ({ enqueueScheduledPost: vi.fn() }));
vi.mock("@/lib/queue/client", () => ({ getRedisConnection: vi.fn() }));
import { processPublishPost, reconcileScheduledPosts } from "@/lib/queue/post-worker";
const post = { id: "p1", workspaceId: "w1", instagramAccount: { id: "a1", workspaceId: "w1", instagramId: "ig1", accessToken: "encrypted" }, mediaUrls: ["https://example.com/a.jpg"], mediaType: "IMAGE", caption: "Test", autoCampaignEnabled: false, metaContainerId: null };
const job = { data: { scheduledPostId: "p1", workspaceId: "w1", queueVersion: 2 } } as Job;

describe("Post delivery safety", () => {
  beforeEach(() => { vi.resetAllMocks(); db.scheduledPost.updateMany.mockResolvedValue({ count: 1 }); db.scheduledPost.findFirstOrThrow.mockResolvedValue(post); });
  it("does not publish stale, concurrent or cross-workspace jobs", async () => {
    db.scheduledPost.updateMany.mockResolvedValue({ count: 0 });
    await processPublishPost(job);
    expect(publish).not.toHaveBeenCalled();
    expect(db.scheduledPost.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ workspaceId: "w1", queueVersion: 2, publishAttemptedAt: null, status: { in: ["SCHEDULED", "FAILED"] } }) }));
  });
  it("records publication before optional campaign creation and obeys campaign limits", async () => {
    db.scheduledPost.findFirstOrThrow.mockResolvedValue({ ...post, autoCampaignEnabled: true, autoCampaignKeywords: ["LINK"], autoCampaignDmMessage: "hello" });
    publish.mockImplementation(async (_id, _token, options) => {
      await options.onContainerCreated("c1"); await options.onPublishStarted(); await options.onPublished("m1"); return { mediaId: "m1" };
    });
    createCampaign.mockRejectedValue(new Error("Limite do plano"));
    await processPublishPost(job);
    expect(db.scheduledPost.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PUBLISHED", publishedPostId: "m1" }) }));
    expect(db.scheduledPost.update).toHaveBeenCalledWith(expect.objectContaining({ data: { errorMessage: expect.stringContaining("Limite do plano") } }));
    expect(db.scheduledPost.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
  });
  it("stops automatic retries after an ambiguous external publication", async () => {
    publish.mockImplementation(async (_id, _token, options) => { await options.onPublishStarted(); throw new Error("socket closed"); });
    await expect(processPublishPost(job)).rejects.toBeInstanceOf(UnrecoverableError);
    expect(db.scheduledPost.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: { status: "FAILED", errorMessage: expect.stringContaining("Confira o Instagram") } }));
  });
  it("fences an old worker before its external publish call", async () => {
    db.scheduledPost.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }).mockResolvedValue({ count: 1 });
    publish.mockImplementation(async (_id, _token, options) => {
      await options.onPublishStarted();
      throw new Error("External publication must not be reached");
    });
    await expect(processPublishPost(job)).rejects.toBeInstanceOf(UnrecoverableError);
  });
  it("recovers interrupted work but holds uncertain external outcomes", async () => {
    db.scheduledPost.findMany.mockResolvedValueOnce([
      { id: "safe", workspaceId: "w1", publishAttemptedAt: null, updatedAt: new Date(0) },
      { id: "uncertain", workspaceId: "w1", publishAttemptedAt: new Date(), updatedAt: new Date(0) },
    ]).mockResolvedValueOnce([]);
    await reconcileScheduledPosts();
    expect(db.scheduledPost.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "safe" }), data: expect.objectContaining({ status: "SCHEDULED", queueVersion: { increment: 1 } }) }));
    expect(db.scheduledPost.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "uncertain" }), data: expect.objectContaining({ status: "FAILED" }) }));
    expect(db.operationalEvent.create).toHaveBeenCalledTimes(1);
  });
  it("allows retries before publication and reuses a stored container", async () => {
    db.scheduledPost.findFirstOrThrow.mockResolvedValue({ ...post, metaContainerId: "c_existing" });
    publish.mockRejectedValue(new Error("container processing"));
    await expect(processPublishPost(job)).rejects.toThrow("container processing");
    expect(publish).toHaveBeenCalledWith("ig1", "token", expect.objectContaining({ existingContainerId: "c_existing" }));
  });
});
