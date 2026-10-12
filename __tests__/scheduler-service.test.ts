import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listScheduledPosts,
  getScheduledPostById,
  deleteScheduledPost,
} from "@/lib/scheduler/service";
import { prisma } from "@/lib/db/client";

vi.mock("@/lib/db/client", () => ({
  prisma: {
    scheduledPost: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    instagramAccount: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/queue/client", () => ({
  getPostPublishingQueue: vi.fn(() => ({
    add: vi.fn(),
    getJob: vi.fn(() => null),
  })),
}));

describe("Scheduler Domain Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists scheduled posts filtered by workspaceId strictly", async () => {
    const mockPosts = [
      { id: "post_1", workspaceId: "ws_alpha", caption: "Post 1" },
    ];
    vi.mocked(prisma.scheduledPost.findMany).mockResolvedValue(mockPosts as never);

    const result = await listScheduledPosts("ws_alpha");

    expect(prisma.scheduledPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: "ws_alpha" }),
      })
    );
    expect(result).toEqual(mockPosts);
  });

  it("retrieves a scheduled post ensuring workspace ownership", async () => {
    const mockPost = { id: "post_1", workspaceId: "ws_alpha", caption: "Post 1" };
    vi.mocked(prisma.scheduledPost.findFirst).mockResolvedValue(mockPost as never);

    const result = await getScheduledPostById("ws_alpha", "post_1");

    expect(prisma.scheduledPost.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post_1", workspaceId: "ws_alpha" },
      })
    );
    expect(result).toEqual(mockPost);
  });

  it("throws error when attempting to delete a post not belonging to workspace", async () => {
    vi.mocked(prisma.scheduledPost.findFirst).mockResolvedValue(null as never);

    await expect(deleteScheduledPost("ws_hacker", "post_1")).rejects.toThrow(
      "Post agendado não encontrado"
    );
  });
});
