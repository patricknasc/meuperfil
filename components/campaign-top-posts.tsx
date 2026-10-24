"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useFlowTranslation } from "@/lib/i18n/use-flow-translation";

interface TopPost {
  mediaId: string;
  comments: number;
  sent: number;
  media: { thumbnail: string | null; permalink: string | null; caption: string | null; type: string } | null;
}

/** Posts and reels that generated the most DMs for a campaign. */
export default function CampaignTopPosts({ campaignId }: { campaignId: string }) {
  const t = useFlowTranslation();
  const [posts, setPosts] = useState<TopPost[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/automations/top-posts?id=${encodeURIComponent(campaignId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPosts(data.success ? data.data : []);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{t("Posts that generated the most DMs")}</p>
      {posts === null ? (
        <div className="mt-4 h-24 rounded-xl bg-surface-hover animate-pulse" />
      ) : posts.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("No DMs from posts yet.")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {posts.map((post, index) => (
            <li key={post.mediaId}>
              <a
                href={post.media?.permalink ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2 hover:border-border-hover transition"
              >
                <span className="w-5 text-center text-xs font-semibold text-muted">{index + 1}</span>
                {post.media?.thumbnail ? (
                  <img src={post.media.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-surface-hover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">
                    {post.media?.caption || (post.media ? t("No caption") : t("Post unavailable"))}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    <b className="text-success">{post.sent}</b> {t("DMs sent")} · {post.comments} {t("comments")}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
