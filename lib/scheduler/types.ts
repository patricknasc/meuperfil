/**
 * Post Scheduler Extensible Architecture
 *
 * Prepared for future social media publishing, reel scheduling,
 * and automated keyword-link campaign bindings.
 */

export type PostPlatform = "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "TWITTER" | "LINKEDIN";

export type PostMediaType = "IMAGE" | "CAROUSEL" | "REEL" | "STORY" | "TEXT";

export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";

export interface ScheduledPost {
  id: string;
  workspaceId: string;
  instagramAccountId?: string | null;
  caption: string;
  mediaUrls: string[];
  mediaType: PostMediaType;
  platform: PostPlatform;
  scheduledFor: Date;
  status: PostStatus;
  publishedPostId?: string | null;
  publishedPostUrl?: string | null;
  autoCampaignEnabled: boolean; // Auto-attach Comment-to-DM campaign upon publishing
  autoCampaignKeywords?: string[];
  autoCampaignDmMessage?: string;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
