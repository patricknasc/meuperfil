import { Worker, UnrecoverableError, type Job } from "bullmq";
import { getRedisConnection, type PublishPostJob } from "./client";
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/meta/oauth";
import { publishToInstagram } from "@/lib/meta/publisher";
import { createCampaign } from "@/lib/campaigns/service";
import { generateReportShareSlug } from "@/lib/reports/share";
import { enqueueScheduledPost } from "@/lib/scheduler/service";

const UNCERTAIN_PUBLICATION = "Não foi possível confirmar o resultado da publicação. Confira o Instagram e contate o suporte antes de tentar novamente.";

export async function processPublishPost(job: Job<PublishPostJob>): Promise<void> {
  const { scheduledPostId, workspaceId } = job.data;
  const queueVersion = job.data.queueVersion ?? 0;
  // Atomic ownership: an old job or a second concurrent job cannot publish.
  const claimed = await prisma.scheduledPost.updateMany({
    where: {
      id: scheduledPostId, workspaceId, queueVersion,
      status: { in: ["SCHEDULED", "FAILED"] }, publishAttemptedAt: null,
    },
    data: { status: "PUBLISHING", errorMessage: null },
  });
  if (!claimed.count) return;

  let publishStarted = false;
  try {
    const post = await prisma.scheduledPost.findFirstOrThrow({
      where: { id: scheduledPostId, workspaceId }, include: { instagramAccount: true },
    });
    if (!post.instagramAccount || post.instagramAccount.workspaceId !== workspaceId) {
      throw new UnrecoverableError("Nenhuma conta do Instagram válida vinculada a este post.");
    }
    const result = await publishToInstagram(post.instagramAccount.instagramId, decryptToken(post.instagramAccount.accessToken), {
      mediaUrls: post.mediaUrls, mediaType: post.mediaType, caption: post.caption, shareToFeed: true,
      existingContainerId: post.metaContainerId,
      onProgress: async () => {
        const refreshed = await prisma.scheduledPost.updateMany({
          where: { id: post.id, workspaceId, queueVersion, status: "PUBLISHING", publishAttemptedAt: null },
          data: { updatedAt: new Date() },
        });
        if (!refreshed.count) throw new UnrecoverableError("A tarefa de publicação foi substituída.");
      },
      onContainerCreated: async (metaContainerId) => {
        const saved = await prisma.scheduledPost.updateMany({
          where: { id: post.id, workspaceId, queueVersion, status: "PUBLISHING", publishAttemptedAt: null }, data: { metaContainerId },
        });
        if (!saved.count) throw new UnrecoverableError("A tarefa de publicação foi substituída.");
      },
      onPublishStarted: async () => {
        publishStarted = true;
        // Durable marker precedes the external side effect. Uncertain outcomes
        // never cause an automatic second publication.
        const started = await prisma.scheduledPost.updateMany({
          where: { id: post.id, workspaceId, queueVersion, status: "PUBLISHING", publishAttemptedAt: null },
          data: { publishAttemptedAt: new Date() },
        });
        if (!started.count) throw new UnrecoverableError("A tarefa de publicação foi substituída.");
      },
      onPublished: async (publishedPostId) => {
        // Save the external result before optional reporting/campaign work.
        await prisma.scheduledPost.update({
          where: { id: post.id }, data: { status: "PUBLISHED", publishedPostId, publishedAt: new Date(), errorMessage: null },
        });
      },
    });
    await prisma.scheduledPost.update({ where: { id: post.id }, data: { publishedPostUrl: result.permalink ?? null } });
    if (post.autoCampaignEnabled && post.autoCampaignKeywords.length && post.autoCampaignDmMessage) {
      try {
        const automation = await createCampaign({
          workspaceId, instagramAccountId: post.instagramAccount.id,
          name: `Automação: ${post.caption?.slice(0, 30) || "Post Agendado"}`,
          postId: result.mediaId, postUrl: result.permalink ?? null,
          keywords: post.autoCampaignKeywords, wholeWordMatch: true,
          dmMessage: post.autoCampaignDmMessage, isActive: true, reportShareSlug: generateReportShareSlug(),
        });
        await prisma.scheduledPost.update({ where: { id: post.id }, data: { createdAutomationId: automation.id } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        await prisma.scheduledPost.update({
          where: { id: post.id }, data: { errorMessage: `Post publicado, mas a campanha não foi criada: ${message}` },
        });
        await prisma.operationalEvent.create({ data: { workspaceId, source: "WORKER", level: "WARNING", message: `Campanha do post ${post.id}: ${message}` } });
      }
    }
  } catch (error) {
    const message = publishStarted ? UNCERTAIN_PUBLICATION : error instanceof Error ? error.message : "Erro ao publicar.";
    // Never turn a recorded success into FAILED because a follow-up failed.
    await prisma.scheduledPost.updateMany({
      where: { id: scheduledPostId, workspaceId, status: "PUBLISHING", queueVersion },
      data: { status: "FAILED", errorMessage: message },
    });
    if (publishStarted) throw new UnrecoverableError(message);
    throw error;
  }
}

// Repair DB/Redis dual-write gaps without changing the stored schedule.
export async function reconcileScheduledPosts() {
  const interrupted = await prisma.scheduledPost.findMany({
    where: { status: "PUBLISHING", updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
    take: 500,
  });
  for (const post of interrupted) {
    const uncertain = Boolean(post.publishAttemptedAt);
    const changed = await prisma.scheduledPost.updateMany({
      where: { id: post.id, status: "PUBLISHING", updatedAt: post.updatedAt },
      data: uncertain
        ? { status: "FAILED", errorMessage: UNCERTAIN_PUBLICATION }
        : { status: "SCHEDULED", queueVersion: { increment: 1 }, errorMessage: "Processamento interrompido; nova tentativa agendada." },
    });
    if (changed.count && uncertain) {
      await prisma.operationalEvent.create({ data: { workspaceId: post.workspaceId, source: "WORKER", level: "ERROR", message: `Post ${post.id}: ${UNCERTAIN_PUBLICATION}` } });
    }
  }
  const posts = await prisma.scheduledPost.findMany({
    where: { status: "SCHEDULED", OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date(Date.now() + 60 * 60 * 1000) } }] },
    orderBy: [{ scheduledFor: "asc" }, { id: "asc" }], take: 500,
  });
  for (const post of posts) await enqueueScheduledPost(post);
}

export function createPostPublisherWorker(): Worker<PublishPostJob> {
  const worker = new Worker<PublishPostJob>("post-publishing", processPublishPost, { connection: getRedisConnection(), concurrency: 5 });
  worker.on("failed", (job, error) => {
    console.error(`[Post Worker] Job ${job?.id} failed:`, error.message);
    void prisma.operationalEvent.create({
      data: { workspaceId: job?.data.workspaceId, source: "WORKER", level: "ERROR", message: `Post ${job?.data.scheduledPostId}: ${error.message}` },
    }).catch((recordError) => console.error("Post alert could not be saved", recordError));
  });
  return worker;
}
