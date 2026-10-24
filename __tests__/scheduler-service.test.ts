import { describe, it, expect, vi, beforeEach } from "vitest";
import { listScheduledPosts, getScheduledPostById, deleteScheduledPost, createScheduledPost, updateScheduledPost, triggerInstantPublish } from "@/lib/scheduler/service";
import { prisma } from "@/lib/db/client";

const { queue } = vi.hoisted(() => ({ queue: { add: vi.fn(), getJob: vi.fn() } }));
vi.mock("@/lib/db/client", () => {
  const tx = {
    $queryRaw: vi.fn(),
    scheduledPost: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    workspace: { findUniqueOrThrow: vi.fn() }, instagramAccount: { findFirst: vi.fn() },
  };
  return { prisma: { ...tx, $transaction: vi.fn((callback) => callback(tx)) } };
});
vi.mock("@/lib/queue/client", () => ({ getPostPublishingQueue: () => queue }));
const future = new Date(Date.now() + 3600_000).toISOString();
const input = { instagramAccountId: "acc_1", mediaUrls: ["https://example.com/a.jpg"], mediaType: "IMAGE" as const, platform: "INSTAGRAM" as const, autoCampaignEnabled: false, autoCampaignKeywords: [], publishNow: false };
const draft = { id: "post_1", workspaceId: "ws_1", ...input, status: "DRAFT", scheduledFor: null, queueVersion: 0, publishAttemptedAt: null };

describe("Scheduler Domain Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.workspace.findUniqueOrThrow).mockResolvedValue({ plan: "FREE", subscriptionStatus: "NONE" } as never);
    vi.mocked(prisma.scheduledPost.count).mockResolvedValue(0);
    vi.mocked(prisma.instagramAccount.findFirst).mockResolvedValue({ id: "acc_1" } as never);
    vi.mocked(prisma.scheduledPost.findFirst).mockResolvedValue(draft as never);
  });
  it("lists and retrieves posts scoped to the workspace", async () => {
    await listScheduledPosts("ws_1"); await getScheduledPostById("ws_1", "post_1");
    expect(prisma.scheduledPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ workspaceId: "ws_1" }) }));
    expect(prisma.scheduledPost.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "post_1", workspaceId: "ws_1" } }));
  });
  it("never selects account credentials in creation or update responses", async () => {
    vi.mocked(prisma.scheduledPost.create).mockResolvedValue(draft as never);
    vi.mocked(prisma.scheduledPost.update).mockResolvedValue(draft as never);
    await createScheduledPost("ws_1", input);
    await updateScheduledPost("ws_1", "post_1", { caption: "new" });
    for (const mock of [prisma.scheduledPost.create, prisma.scheduledPost.update]) {
      expect(mock).toHaveBeenCalledWith(expect.objectContaining({ include: { instagramAccount: { select: { id: true, instagramId: true, username: true, name: true } } } }));
    }
  });
  it("allows drafts at quota but blocks promotion and immediate publication", async () => {
    vi.mocked(prisma.scheduledPost.count).mockResolvedValue(5);
    vi.mocked(prisma.scheduledPost.create).mockResolvedValue(draft as never);
    await createScheduledPost("ws_1", input);
    await expect(updateScheduledPost("ws_1", "post_1", { status: "SCHEDULED", scheduledFor: future })).rejects.toThrow("Limite");
    await expect(triggerInstantPublish("ws_1", "post_1")).rejects.toThrow("Limite");
    expect(queue.add).not.toHaveBeenCalled();
  });
  it("keeps the schedule when Redis fails so reconciliation can recover it", async () => {
    const post = { ...draft, status: "SCHEDULED", scheduledFor: new Date(future) };
    vi.mocked(prisma.scheduledPost.create).mockResolvedValue(post as never);
    queue.add.mockRejectedValue(new Error("Redis down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(createScheduledPost("ws_1", { ...input, scheduledFor: future })).resolves.toEqual(post);
    expect(queue.add).toHaveBeenCalledWith("publish-post", { scheduledPostId: "post_1", workspaceId: "ws_1", queueVersion: 0 }, expect.objectContaining({ jobId: "post-post_1-v0" }));
    vi.restoreAllMocks();
  });
  it("rejects invalid merged updates", async () => {
    await expect(updateScheduledPost("ws_1", "post_1", { mediaType: "CAROUSEL" })).rejects.toThrow();
    await expect(updateScheduledPost("ws_1", "post_1", { autoCampaignEnabled: true })).rejects.toThrow();
    expect(prisma.scheduledPost.update).not.toHaveBeenCalled();
  });
  it("blocks deletion of a publishing post and retry of an uncertain outcome", async () => {
    vi.mocked(prisma.scheduledPost.findFirst).mockResolvedValue({ ...draft, status: "PUBLISHING" } as never);
    await expect(deleteScheduledPost("ws_1", "post_1")).rejects.toThrow("processamento");
    vi.mocked(prisma.scheduledPost.findFirst).mockResolvedValue({ ...draft, status: "FAILED", publishAttemptedAt: new Date() } as never);
    await expect(triggerInstantPublish("ws_1", "post_1")).rejects.toThrow("conferido");
  });
  it("rejects an inaccessible post", async () => {
    vi.mocked(prisma.scheduledPost.findFirst).mockResolvedValue(null);
    await expect(deleteScheduledPost("ws_other", "post_1")).rejects.toThrow("não encontrado");
  });
});
