/**
 * Meta Graph API Content Publisher
 *
 * Official Instagram Graph API Content Publishing integration
 * supporting Reels, Stories, Carousels, Single Images and Videos.
 */

import { getMetaGraphApiVersion } from "@/lib/env";
import { MetaApiError, TokenExpiredError, RateLimitError } from "@/lib/meta/client";

function graphBase() {
  return `https://graph.instagram.com/${getMetaGraphApiVersion()}`;
}

export type PublisherMediaType = "IMAGE" | "VIDEO" | "CAROUSEL" | "REEL" | "STORY";

export interface PublishMediaOptions {
  mediaUrls: string[];
  mediaType: PublisherMediaType;
  caption?: string | null;
  coverUrl?: string | null;
  shareToFeed?: boolean;
  locationId?: string | null;
  existingContainerId?: string | null;
  onContainerCreated?: (containerId: string) => Promise<void>;
  onPublishStarted?: () => Promise<void>;
  onPublished?: (mediaId: string) => Promise<void>;
  onProgress?: () => Promise<void>;
}

export interface PublishResult {
  mediaId: string;
  permalink?: string;
}

interface ContainerResponse {
  id: string;
}

interface ContainerStatusResponse {
  id: string;
  status_code: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";
  status?: string;
}

interface PublishedMediaResponse {
  id: string;
}

interface MediaPermalinkResponse {
  id: string;
  permalink?: string;
}

async function fetchGraph<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = new URL(`${graphBase()}${endpoint}`);
  const accessToken = url.searchParams.get("access_token");
  url.searchParams.delete("access_token");
  const headers = new Headers(options?.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(url.toString(), { ...options, headers, signal: AbortSignal.timeout(20_000) });
  const data = await response.json();

  if (!response.ok || data.error) {
    const err = data.error;
    const code = err?.code ?? response.status;
    const subcode = err?.error_subcode;
    const message = err?.message ?? "Unknown Meta Publishing Error";
    const traceId = err?.fbtrace_id;

    if (code === 190) {
      throw new TokenExpiredError(message, traceId);
    }
    if (code === 368 || code === 4 || code === 17) {
      throw new RateLimitError(message, traceId);
    }
    throw new MetaApiError(code, subcode, traceId, message);
  }

  return data as T;
}

/**
 * Creates a media container for a single photo, video, reel, or story item.
 */
export async function createSingleMediaContainer(
  instagramId: string,
  accessToken: string,
  options: {
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO" | "REEL" | "STORY";
    caption?: string | null;
    coverUrl?: string | null;
    isCarouselItem?: boolean;
    shareToFeed?: boolean;
  }
): Promise<string> {
  const params = new URLSearchParams({
    access_token: accessToken,
  });

  if (options.caption && !options.isCarouselItem && options.mediaType !== "STORY") {
    params.set("caption", options.caption);
  }

  if (options.isCarouselItem) {
    params.set("is_carousel_item", "true");
  }

  if (options.mediaType === "REEL") {
    params.set("media_type", "REELS");
    params.set("video_url", options.mediaUrl);
    if (options.shareToFeed ?? true) {
      params.set("share_to_feed", "true");
    }
    if (options.coverUrl) {
      params.set("cover_url", options.coverUrl);
    }
  } else if (options.mediaType === "STORY") {
    params.set("media_type", "STORIES");
    // Stories can be image or video
    const isVideo = options.mediaUrl.match(/\.(mp4|mov|webm)(\?.*)?$/i);
    if (isVideo) {
      params.set("video_url", options.mediaUrl);
    } else {
      params.set("image_url", options.mediaUrl);
    }
  } else if (options.mediaType === "VIDEO") {
    params.set("media_type", options.isCarouselItem ? "VIDEO" : "REELS");
    params.set("video_url", options.mediaUrl);
  } else {
    // IMAGE
    params.set("image_url", options.mediaUrl);
  }

  const res = await fetchGraph<ContainerResponse>(`/${instagramId}/media?${params.toString()}`, {
    method: "POST",
  });

  return res.id;
}

/**
 * Creates a carousel container referencing up to 10 child containers.
 */
export async function createCarouselContainer(
  instagramId: string,
  accessToken: string,
  childrenIds: string[],
  caption?: string | null
): Promise<string> {
  const params = new URLSearchParams({
    access_token: accessToken,
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
  });

  if (caption) {
    params.set("caption", caption);
  }

  const res = await fetchGraph<ContainerResponse>(`/${instagramId}/media?${params.toString()}`, {
    method: "POST",
  });

  return res.id;
}

/**
 * Polls the container status until it finishes encoding (or fails).
 * Video/Reels require processing time before media_publish can be called.
 */
export async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  maxAttempts = 15,
  intervalMs = 3000,
  onProgress?: () => Promise<void>
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await onProgress?.();
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: "status_code,status",
    });

    const res = await fetchGraph<ContainerStatusResponse>(`/${containerId}?${params.toString()}`);

    if (res.status_code === "FINISHED") {
      return;
    }

    if (res.status_code === "ERROR" || res.status_code === "EXPIRED") {
      throw new Error(`Media container processing failed with status: ${res.status_code} (${res.status || "Unknown error"})`);
    }

    // Wait before polling again
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error("Timed out waiting for Instagram media container to finish processing.");
}

/**
 * Publishes an uploaded and ready media container.
 */
export async function publishContainer(
  instagramId: string,
  accessToken: string,
  creationId: string
): Promise<string> {
  const params = new URLSearchParams({
    access_token: accessToken,
    creation_id: creationId,
  });

  const res = await fetchGraph<PublishedMediaResponse>(`/${instagramId}/media_publish?${params.toString()}`, {
    method: "POST",
  });

  return res.id;
}

/**
 * Retrieves the published post permalink.
 */
export async function getPublishedMediaDetails(
  mediaId: string,
  accessToken: string
): Promise<{ permalink?: string }> {
  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: "id,permalink",
    });

    const res = await fetchGraph<MediaPermalinkResponse>(`/${mediaId}?${params.toString()}`);
    return { permalink: res.permalink };
  } catch {
    // Non-fatal if permalink fetch fails
    return {};
  }
}

/**
 * Complete publishing orchestrator for any media type.
 */
export async function publishToInstagram(
  instagramId: string,
  accessToken: string,
  options: PublishMediaOptions
): Promise<PublishResult> {
  if (!options.mediaUrls || options.mediaUrls.length === 0) {
    throw new Error("Cannot publish post without media URLs.");
  }

  let finalContainerId: string;

  if (options.existingContainerId) {
    finalContainerId = options.existingContainerId;
  } else if (options.mediaType === "CAROUSEL" && options.mediaUrls.length > 1) {
    // 1. Create all child items
    const childIds: string[] = [];
    for (const url of options.mediaUrls) {
      const isVideo = url.match(/\.(mp4|mov|webm)(\?.*)?$/i);
      await options.onProgress?.();
      const childId = await createSingleMediaContainer(instagramId, accessToken, {
        mediaUrl: url,
        mediaType: isVideo ? "VIDEO" : "IMAGE",
        isCarouselItem: true,
      });
      childIds.push(childId);
    }

    // 2. Wait for each child to be ready
    for (const childId of childIds) {
      await waitForContainerReady(childId, accessToken, 15, 3000, options.onProgress);
    }

    // 3. Create parent carousel container
    finalContainerId = await createCarouselContainer(
      instagramId,
      accessToken,
      childIds,
      options.caption
    );
  } else {
    // Single item (REEL, STORY, VIDEO, IMAGE)
    const singleType = options.mediaType === "CAROUSEL" ? "IMAGE" : options.mediaType;
    finalContainerId = await createSingleMediaContainer(instagramId, accessToken, {
      mediaUrl: options.mediaUrls[0],
      mediaType: singleType,
      caption: options.caption,
      coverUrl: options.coverUrl,
      shareToFeed: options.shareToFeed,
    });
  }

  await options.onContainerCreated?.(finalContainerId);

  // 4. Wait for final container to be ready
  await waitForContainerReady(finalContainerId, accessToken, 15, 3000, options.onProgress);

  // 5. Publish
  await options.onPublishStarted?.();
  const publishedMediaId = await publishContainer(instagramId, accessToken, finalContainerId);

  await options.onPublished?.(publishedMediaId);

  // 6. Fetch permalink
  const details = await getPublishedMediaDetails(publishedMediaId, accessToken);

  return {
    mediaId: publishedMediaId,
    permalink: details.permalink,
  };
}
