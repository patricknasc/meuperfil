import { prisma } from "@/lib/db/client";
import { getPostPublishingQueue } from "@/lib/queue/client";
import { getEffectivePlan, PLAN_LIMITS } from "@/lib/billing/plans";
import { createScheduledPostSchema, updateScheduledPostSchema, type CreateScheduledPostInput, type UpdateScheduledPostInput } from "./validation";
import type { Prisma, PostStatus, ScheduledPost } from "@/app/generated/prisma/client";

export class SchedulerError extends Error {}

const accountSummary = { select: { id: true, instagramId: true, username: true, name: true } } as const;
const includeSummary = { instagramAccount: accountSummary } as const;

export interface ScheduledPostFilters {
  status?: PostStatus;
  instagramAccountId?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function listScheduledPosts(workspaceId: string, filters?: ScheduledPostFilters) {
  return prisma.scheduledPost.findMany({
    where: {
      workspaceId,
      status: filters?.status,
      instagramAccountId: filters?.instagramAccountId,
      ...(filters?.startDate || filters?.endDate ? {
        scheduledFor: { gte: filters.startDate, lte: filters.endDate },
      } : {}),
    },
    include: includeSummary,
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
  });
}

export async function getScheduledPostById(workspaceId: string, postId: string) {
  return prisma.scheduledPost.findFirst({ where: { id: postId, workspaceId }, include: includeSummary });
}

async function lockWorkspace(tx: Prisma.TransactionClient, workspaceId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Workspace" WHERE "id" = ${workspaceId} FOR UPDATE`;
}

async function checkQuota(tx: Prisma.TransactionClient, workspaceId: string) {
  const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const limit = PLAN_LIMITS[getEffectivePlan(workspace.plan, workspace.subscriptionStatus)].maxScheduledPostsPerMonth;
  if (!Number.isFinite(limit)) return;
  const now = new Date();
  const count = await tx.scheduledPost.count({
    where: { workspaceId, quotaCountedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }, status: { not: "DRAFT" } },
  });
  if (count >= limit) throw new SchedulerError(`Limite do plano atingido (${count}/${limit} posts no mês).`);
}

async function editablePost(tx: Prisma.TransactionClient, workspaceId: string, postId: string) {
  await tx.$queryRaw`SELECT "id" FROM "ScheduledPost" WHERE "id" = ${postId} AND "workspaceId" = ${workspaceId} FOR UPDATE`;
  const post = await tx.scheduledPost.findFirst({ where: { id: postId, workspaceId } });
  if (!post) throw new SchedulerError("Post agendado não encontrado.");
  if (post.status === "PUBLISHING" || post.status === "PUBLISHED") {
    throw new SchedulerError("Este post já está publicado ou em processamento.");
  }
  if (post.publishAttemptedAt) {
    throw new SchedulerError("O resultado da publicação precisa ser conferido no Instagram antes de tentar novamente. Contate o suporte.");
  }
  return post;
}

export function postJobId(post: Pick<ScheduledPost, "id" | "queueVersion">) {
  return `post-${post.id}-v${post.queueVersion}`;
}

// The database is the source of truth. The worker also reconciles schedules if
// Redis is temporarily unavailable between the database commit and enqueue.
export async function enqueueScheduledPost(post: ScheduledPost) {
  if (post.status !== "SCHEDULED") return;
  const queue = getPostPublishingQueue();
  const existing = await queue.getJob(postJobId(post));
  if (existing) {
    if (await existing.getState() === "failed") await existing.retry();
    return;
  }
  await queue.add("publish-post", {
    scheduledPostId: post.id,
    workspaceId: post.workspaceId,
    queueVersion: post.queueVersion,
  }, { jobId: postJobId(post), delay: Math.max(0, (post.scheduledFor?.getTime() ?? Date.now()) - Date.now()) });
}

async function deliverSchedule(post: ScheduledPost) {
  try {
    await enqueueScheduledPost(post);
  } catch (error) {
    console.error("Schedule saved; worker will reconcile queue delivery", { postId: post.id, error });
  }
}

export async function createScheduledPost(workspaceId: string, input: CreateScheduledPostInput) {
  const validated = createScheduledPostSchema.parse(input);
  const status: PostStatus = validated.publishNow || validated.scheduledFor ? "SCHEDULED" : "DRAFT";
  const post = await prisma.$transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    if (status === "SCHEDULED") await checkQuota(tx, workspaceId);
    const account = await tx.instagramAccount.findFirst({
      where: { id: validated.instagramAccountId, workspaceId }, select: { id: true },
    });
    if (!account) throw new SchedulerError("Conta do Instagram não encontrada ou não pertence a este workspace.");
    return tx.scheduledPost.create({
      data: {
        workspaceId, instagramAccountId: account.id, caption: validated.caption || null,
        mediaUrls: validated.mediaUrls, mediaType: validated.mediaType, platform: "INSTAGRAM",
        scheduledFor: validated.publishNow ? new Date() : validated.scheduledFor ? new Date(validated.scheduledFor) : null,
        status, quotaCountedAt: status === "SCHEDULED" ? new Date() : null, autoCampaignEnabled: validated.autoCampaignEnabled,
        autoCampaignKeywords: validated.autoCampaignKeywords, autoCampaignDmMessage: validated.autoCampaignDmMessage || null,
      }, include: includeSummary,
    });
  });
  await deliverSchedule(post);
  return post;
}

export async function updateScheduledPost(workspaceId: string, postId: string, input: UpdateScheduledPostInput) {
  input = updateScheduledPostSchema.parse(input);
  const updated = await prisma.$transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    const existing = await editablePost(tx, workspaceId, postId);
    const merged = { ...existing, ...input };
    const status = input.status ?? (existing.status === "FAILED" ? "DRAFT" : existing.status);
    // Validate the whole edited draft, including cross-field constraints.
    createScheduledPostSchema.parse({
      ...merged, instagramAccountId: existing.instagramAccountId,
      scheduledFor: input.scheduledFor ?? undefined,
      publishNow: false,
    });
    const scheduledFor = status === "DRAFT" ? null : merged.scheduledFor ? new Date(merged.scheduledFor) : null;
    if (status === "SCHEDULED" && !scheduledFor) throw new SchedulerError("Informe a data de agendamento ou use Publicar agora.");
    if (status === "SCHEDULED" && existing.status === "DRAFT") await checkQuota(tx, workspaceId);
    return tx.scheduledPost.update({
      where: { id: postId },
      data: {
        ...input, status, scheduledFor, queueVersion: { increment: 1 },
        quotaCountedAt: status === "SCHEDULED" && existing.status === "DRAFT" ? new Date() : existing.quotaCountedAt,
        metaContainerId: null, errorMessage: null,
      }, include: includeSummary,
    });
  });
  await deliverSchedule(updated);
  return updated;
}

export async function deleteScheduledPost(workspaceId: string, postId: string) {
  return prisma.$transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    await editablePost(tx, workspaceId, postId);
    // Stale jobs safely exit when the record is absent.
    return tx.scheduledPost.delete({ where: { id: postId } });
  });
}

export async function triggerInstantPublish(workspaceId: string, postId: string) {
  const post = await prisma.$transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    const existing = await editablePost(tx, workspaceId, postId);
    createScheduledPostSchema.parse({ ...existing, scheduledFor: undefined, publishNow: true });
    if (existing.status === "DRAFT") await checkQuota(tx, workspaceId);
    return tx.scheduledPost.update({
      where: { id: postId },
      data: { status: "SCHEDULED", scheduledFor: new Date(), queueVersion: { increment: 1 }, errorMessage: null,
        quotaCountedAt: existing.status === "DRAFT" ? new Date() : existing.quotaCountedAt },
    });
  });
  await deliverSchedule(post);
  return { success: true };
}
