-- CreateEnum
CREATE TYPE "PostPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "PostMediaType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL', 'REEL', 'STORY');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "instagramAccountId" TEXT,
    "caption" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaType" "PostMediaType" NOT NULL DEFAULT 'IMAGE',
    "platform" "PostPlatform" NOT NULL DEFAULT 'INSTAGRAM',
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "metaContainerId" TEXT,
    "publishedPostId" TEXT,
    "publishedPostUrl" TEXT,
    "errorMessage" TEXT,
    "autoCampaignEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoCampaignKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "autoCampaignDmMessage" TEXT,
    "createdAutomationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledPost_workspaceId_idx" ON "ScheduledPost"("workspaceId");

-- CreateIndex
CREATE INDEX "ScheduledPost_instagramAccountId_idx" ON "ScheduledPost"("instagramAccountId");

-- CreateIndex
CREATE INDEX "ScheduledPost_status_idx" ON "ScheduledPost"("status");

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledFor_idx" ON "ScheduledPost"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledPost_workspaceId_status_idx" ON "ScheduledPost"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
