"use client";
import { useFlowTranslation } from "@/lib/i18n/use-flow-translation";

/* eslint-disable @next/next/no-img-element */

/**
 * Post Picker
 *
 * Grid of Instagram post thumbnails, selectable.
 * Fetches from /api/instagram/posts.
 */

import { useEffect, useState } from "react";

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
}

/** postId used by campaigns that answer comments on any post or reel. */
export const ALL_POSTS = "ALL_POSTS";

interface PostPickerProps {
  selectedPostId: string | null;
  instagramAccountId?: string | null;
  onSelect: (postId: string, postUrl?: string) => void;
}

export default function PostPicker({
  selectedPostId,
  instagramAccountId,
  onSelect,
}: PostPickerProps) {
  const t = useFlowTranslation();
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ after: nextCursor });
    if (instagramAccountId) params.set("instagramAccountId", instagramAccountId);
    try {
      const data = await fetch(`/api/instagram/posts?${params}`).then((r) => r.json());
      if (data.success) {
        setPosts((current) => [...current, ...data.data]);
        setNextCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (instagramAccountId) {
      params.set("instagramAccountId", instagramAccountId);
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      setPosts([]);

      fetch(`/api/instagram/posts${params.size ? `?${params}` : ""}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (data.success) {
            setPosts(data.data);
            setNextCursor(data.nextCursor ?? null);
          } else {
            setError(t("Failed to load posts"));
          }
        })
        .catch(() => {
          if (!cancelled) setError(t("Failed to load posts"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [instagramAccountId, t]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-surface-hover animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted">{error}</p>
        <p className="text-xs text-muted mt-1">{t("Connect your Instagram account first")}</p>
      </div>
    );
  }

  const allSelected = selectedPostId === ALL_POSTS;
  const typeLabel: Record<string, string> = { VIDEO: t("Video"), CAROUSEL_ALBUM: t("Carousel"), REELS: "Reel" };

  return (
    <div className="space-y-3">
    <button
      type="button"
      onClick={() => onSelect(ALL_POSTS)}
      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition ${
        allSelected ? "border-accent bg-accent/10" : "border-border hover:border-border-hover"
      }`}
    >
      <p className="text-sm font-semibold text-foreground">{t("All posts and reels")}</p>
      <p className="text-xs text-muted mt-0.5">
        {t("Answers the keyword on any current or future post. A campaign for a specific post takes priority.")}
      </p>
    </button>
    {posts.length === 0 ? (
      <p className="text-center text-sm text-muted py-4">{t("No posts found")}</p>
    ) : (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto p-1">
      {posts.map((post) => {
        const isSelected = selectedPostId === post.id;
        const thumb = post.thumbnail_url ?? post.media_url;
        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onSelect(post.id, post.permalink)}
            className={`
              relative aspect-square rounded-xl overflow-hidden border-2 transition-all
              ${isSelected ? "border-accent ring-2 ring-accent/30 scale-[1.02]" : "border-transparent hover:border-border-hover"}
            `}
          >
            {thumb ? (
              <img
                src={thumb}
                alt={post.caption?.slice(0, 50) ?? t("Instagram post")}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-hover flex items-center justify-center">
                <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 0 1 2.25-2.25h15A2.25 2.25 0 0 1 21.75 6v12A2.25 2.25 0 0 1 19.5 20.25H4.5A2.25 2.25 0 0 1 2.25 18Z" />
                </svg>
              </div>
            )}
            {typeLabel[post.media_type] && (
              <span className="absolute top-1.5 left-1.5 rounded-md bg-ink/40 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                {typeLabel[post.media_type]}
              </span>
            )}
            {isSelected && (
              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
    )}
    {nextCursor && (
      <button
        type="button"
        onClick={() => void loadMore()}
        disabled={loadingMore}
        className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-semibold text-muted hover:text-foreground hover:border-border-hover transition disabled:opacity-50"
      >
        {loadingMore ? t("Loading...") : t("Load more posts")}
      </button>
    )}
    </div>
  );
}
