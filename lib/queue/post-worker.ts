import { Worker, type Job } from "bullmq";
import { getRedisConnection, type PublishPostJob } from "./client";
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/meta/oauth";
import { publishToInstagram } from "@/lib/meta/publisher";

export async function processPublishPost(job: Job<PublishPostJob>): Promise<void> {
  const { scheduledPostId, workspaceId } = job.data;

  const post = await prisma.scheduledPost.findUnique({
    where: { id: scheduledPostId },
    include: {
      instagramAccount: true,
      workspace: true,
    },
  });

  if (!post) {
    console.warn(`[Post Worker] Scheduled post ${scheduledPostId} not found`);
    return;
  }

  if (post.status === "PUBLISHED") {
    console.log(`[Post Worker] Post ${scheduledPostId} is already published, skipping`);
    return;
  }

  if (!post.instagramAccount) {
    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: {
        status: "FAILED",
        errorMessage: "Nenhuma conta do Instagram vinculada a este post.",
      },
    });
    return;
  }

  // 1. Mark status as PUBLISHING
  await prisma.scheduledPost.update({
    where: { id: scheduledPostId },
    data: { status: "PUBLISHING", errorMessage: null },
  });

  try {
    const accessToken = decryptToken(post.instagramAccount.accessToken);
    const instagramId = post.instagramAccount.instagramId;

    // 2. Publish to Instagram
    const result = await publishToInstagram(instagramId, accessToken, {
      mediaUrls: post.mediaUrls,
      mediaType: post.mediaType,
      caption: post.caption,
      shareToFeed: true,
    });

    let createdAutomationId: string | null = null;

    // 3. Auto-create Comment-to-DM Campaign if enabled
    if (
      post.autoCampaignEnabled &&
      post.autoCampaignKeywords.length > 0 &&
      post.autoCampaignDmMessage
    ) {
      try {
        const automation = await prisma.automation.create({
          data: {
            workspaceId,
            instagramAccountId: post.instagramAccount.id,
            name: `Automação: ${post.caption ? post.caption.slice(0, 30) : "Post Agendado"}`,
            postId: result.mediaId,
            postUrl: result.permalink || null,
            keywords: post.autoCampaignKeywords,
            wholeWordMatch: true,
            dmMessage: post.autoCampaignDmMessage,
            isActive: true,
          },
        });
        createdAutomationId = automation.id;
      } catch (autoErr) {
        console.error("[Post Worker] Failed to auto-attach campaign:", autoErr);
      }
    }

    // 4. Update post to PUBLISHED
    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedPostId: result.mediaId,
        publishedPostUrl: result.permalink || null,
        createdAutomationId,
      },
    });

    console.log(`[Post Worker] Successfully published post ${scheduledPostId} (IG Media ID: ${result.mediaId})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao publicar no Instagram";
    console.error(`[Post Worker] Failed to publish post ${scheduledPostId}:`, message);

    await prisma.scheduledPost.update({
      where: { id: scheduledPostId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    throw error;
  }
}

export function createPostPublisherWorker(): Worker<PublishPostJob> {
  const worker = new Worker<PublishPostJob>(
    "post-publishing",
    processPublishPost,
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Post Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
