import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { getMediaDetails } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/oauth";

const TOP_LIMIT = 10;

/**
 * Posts and reels that generated the most DMs for one campaign, with the
 * thumbnail and link fetched from Instagram. Comments logged before the post
 * id was recorded are not included.
 */
export async function GET(request: NextRequest) {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const automationId = request.nextUrl.searchParams.get("id");
  const automation = automationId
    ? await prisma.automation.findFirst({
        where: { id: automationId, workspaceId },
        select: { id: true, instagramAccount: { select: { accessToken: true } } },
      })
    : null;
  if (!automation) {
    return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
  }

  const [matched, sent] = await Promise.all([
    prisma.dmLog.groupBy({
      by: ["mediaId"],
      where: { automationId: automation.id, mediaId: { not: null } },
      _count: { _all: true },
    }),
    prisma.dmLog.groupBy({
      by: ["mediaId"],
      where: { automationId: automation.id, mediaId: { not: null }, status: "SENT" },
      _count: { _all: true },
    }),
  ]);

  const sentByMedia = new Map(sent.map((row) => [row.mediaId, row._count._all]));
  const top = matched
    .map((row) => ({ mediaId: row.mediaId as string, comments: row._count._all, sent: sentByMedia.get(row.mediaId) ?? 0 }))
    .filter((row) => row.mediaId !== "direct_message" && !row.mediaId.startsWith("mention"))
    .sort((a, b) => b.sent - a.sent || b.comments - a.comments)
    .slice(0, TOP_LIMIT);

  let accessToken: string | null = null;
  try {
    accessToken = automation.instagramAccount.accessToken ? decryptToken(automation.instagramAccount.accessToken) : null;
  } catch {
    accessToken = null;
  }

  // Thumbnails are best effort: a deleted post or an expired token still
  // returns the counts.
  const posts = await Promise.all(
    top.map(async (row) => {
      if (!accessToken) return { ...row, media: null };
      try {
        const media = await getMediaDetails(accessToken, row.mediaId);
        return {
          ...row,
          media: {
            thumbnail: media.thumbnail_url ?? media.media_url ?? null,
            permalink: media.permalink ?? null,
            caption: media.caption?.slice(0, 120) ?? null,
            type: media.media_type,
            timestamp: media.timestamp,
          },
        };
      } catch {
        return { ...row, media: null };
      }
    })
  );

  return NextResponse.json({ success: true, data: posts });
}
