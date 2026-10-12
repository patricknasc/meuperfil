import { prisma } from "@/lib/db/client";
import { getPostPublishingQueue } from "@/lib/queue/client";
import { canSchedulePostForWorkspace } from "@/lib/billing/scheduler-limits";
import type { CreateScheduledPostInput, UpdateScheduledPostInput } from "./validation";
import type { PostMediaType, PostStatus } from "@/app/generated/prisma/client";

export interface ScheduledPostFilters {
  status?: PostStatus;
  instagramAccountId?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function listScheduledPosts(
  workspaceId: string,
  filters?: ScheduledPostFilters
) {
  const where: Record<string, unknown> = { workspaceId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.instagramAccountId) {
    where.instagramAccountId = filters.instagramAccountId;
  }

  if (filters?.startDate || filters?.endDate) {
    const scheduledForFilter: Record<string, Date> = {};
    if (filters.startDate) scheduledForFilter.gte = filters.startDate;
    if (filters.endDate) scheduledForFilter.lte = filters.endDate;
    where.scheduledFor = scheduledForFilter;
  }

  return prisma.scheduledPost.findMany({
    where,
    include: {
      instagramAccount: {
        select: {
          id: true,
          instagramId: true,
          username: true,
          name: true,
        },
      },
    },
    orderBy: [
      { scheduledFor: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getScheduledPostById(
  workspaceId: string,
  postId: string
) {
  return prisma.scheduledPost.findFirst({
    where: {
      id: postId,
      workspaceId,
    },
    include: {
      instagramAccount: {
        select: {
          id: true,
          instagramId: true,
          username: true,
          name: true,
        },
      },
    },
  });
}

export async function createScheduledPost(
  workspaceId: string,
  input: CreateScheduledPostInput
) {
  // 1. Quota check
  const quota = await canSchedulePostForWorkspace(workspaceId);
  if (!quota.allowed) {
    throw new Error(
      `Limite do plano atingido (${quota.currentCount}/${quota.limit} posts no mês). Faça upgrade para agendar mais publicações.`
    );
  }

  // 2. Validate Instagram account belongs to workspace
  const account = await prisma.instagramAccount.findFirst({
    where: {
      id: input.instagramAccountId,
      workspaceId,
    },
  });

  if (!account) {
    throw new Error("Conta do Instagram não encontrada ou não pertence a este workspace.");
  }

  const scheduledDate = input.scheduledFor ? new Date(input.scheduledFor) : null;
  const initialStatus: PostStatus = input.publishNow
    ? "SCHEDULED"
    : scheduledDate
    ? "SCHEDULED"
    : "DRAFT";

  // 3. Create DB Record
  const post = await prisma.scheduledPost.create({
    data: {
      workspaceId,
      instagramAccountId: account.id,
      caption: input.caption || null,
      mediaUrls: input.mediaUrls,
      mediaType: input.mediaType as PostMediaType,
      platform: "INSTAGRAM",
      scheduledFor: scheduledDate,
      status: initialStatus,
      autoCampaignEnabled: input.autoCampaignEnabled,
      autoCampaignKeywords: input.autoCampaignKeywords || [],
      autoCampaignDmMessage: input.autoCampaignDmMessage || null,
    },
    include: {
      instagramAccount: true,
    },
  });

  // 4. Enqueue Job
  if (initialStatus === "SCHEDULED") {
    const queue = getPostPublishingQueue();
    const delay = input.publishNow
      ? 0
      : scheduledDate
      ? Math.max(0, scheduledDate.getTime() - Date.now())
      : 0;

    await queue.add(
      "publish-post",
      {
        scheduledPostId: post.id,
        workspaceId,
      },
      {
        jobId: `post-${post.id}`,
        delay,
      }
    );
  }

  return post;
}

export async function updateScheduledPost(
  workspaceId: string,
  postId: string,
  input: UpdateScheduledPostInput
) {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: postId, workspaceId },
  });

  if (!existing) {
    throw new Error("Post agendado não encontrado.");
  }

  if (existing.status === "PUBLISHED" || existing.status === "PUBLISHING") {
    throw new Error("Não é possível editar um post que já está sendo publicado ou foi publicado.");
  }

  const newScheduledDate = input.scheduledFor !== undefined
    ? input.scheduledFor ? new Date(input.scheduledFor) : null
    : existing.scheduledFor;

  const updated = await prisma.scheduledPost.update({
    where: { id: postId },
    data: {
      caption: input.caption !== undefined ? input.caption : existing.caption,
      mediaUrls: input.mediaUrls !== undefined ? input.mediaUrls : existing.mediaUrls,
      mediaType: input.mediaType !== undefined ? (input.mediaType as PostMediaType) : existing.mediaType,
      scheduledFor: newScheduledDate,
      status: input.status || existing.status,
      autoCampaignEnabled: input.autoCampaignEnabled !== undefined ? input.autoCampaignEnabled : existing.autoCampaignEnabled,
      autoCampaignKeywords: input.autoCampaignKeywords !== undefined ? input.autoCampaignKeywords : existing.autoCampaignKeywords,
      autoCampaignDmMessage: input.autoCampaignDmMessage !== undefined ? input.autoCampaignDmMessage : existing.autoCampaignDmMessage,
      errorMessage: null,
    },
    include: {
      instagramAccount: true,
    },
  });

  // Update BullMQ queue job if scheduled time or status changed
  const queue = getPostPublishingQueue();
  const existingJob = await queue.getJob(`post-${postId}`);
  if (existingJob) {
    await existingJob.remove().catch(() => {});
  }

  if (updated.status === "SCHEDULED" && updated.scheduledFor) {
    const delay = Math.max(0, updated.scheduledFor.getTime() - Date.now());
    await queue.add(
      "publish-post",
      {
        scheduledPostId: updated.id,
        workspaceId,
      },
      {
        jobId: `post-${updated.id}`,
        delay,
      }
    );
  }

  return updated;
}

export async function deleteScheduledPost(
  workspaceId: string,
  postId: string
) {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: postId, workspaceId },
  });

  if (!existing) {
    throw new Error("Post agendado não encontrado.");
  }

  // Remove queued job if exists
  const queue = getPostPublishingQueue();
  const existingJob = await queue.getJob(`post-${postId}`);
  if (existingJob) {
    await existingJob.remove().catch(() => {});
  }

  return prisma.scheduledPost.delete({
    where: { id: postId },
  });
}

export async function triggerInstantPublish(
  workspaceId: string,
  postId: string
) {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: postId, workspaceId },
    include: { instagramAccount: true },
  });

  if (!existing) {
    throw new Error("Post não encontrado.");
  }

  if (existing.status === "PUBLISHED" || existing.status === "PUBLISHING") {
    throw new Error("Este post já está publicado ou em processamento.");
  }

  await prisma.scheduledPost.update({
    where: { id: postId },
    data: { status: "SCHEDULED", errorMessage: null },
  });

  const queue = getPostPublishingQueue();
  // Remove any previous delayed job
  const existingJob = await queue.getJob(`post-${postId}`);
  if (existingJob) {
    await existingJob.remove().catch(() => {});
  }

  // Add immediate job
  await queue.add(
    "publish-post",
    {
      scheduledPostId: postId,
      workspaceId,
    },
    {
      jobId: `post-${postId}-${Date.now()}`,
      delay: 0,
    }
  );

  return { success: true };
}
