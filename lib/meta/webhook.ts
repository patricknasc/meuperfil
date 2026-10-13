import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    throw new Error("FACEBOOK_APP_SECRET environment variable is required");
  }

  const expectedSignature =
    "sha256=" + createHmac("sha256", appSecret).update(payload).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export interface WebhookCommentEvent {
  instagramAccountId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  mediaId: string;
  eventType?: "comment" | "mention" | "message";
}

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
    };
  }>;
  changes?: Array<{
    field: string;
    value: {
      id?: string;
      comment_id?: string;
      text?: string;
      from?: {
        id?: string;
        username?: string;
      };
      media?: {
        id?: string;
      };
      media_id?: string;
    };
  }>;
}

interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

export function parseCommentEvents(payload: WebhookPayload): WebhookCommentEvent[] {
  const events: WebhookCommentEvent[] = [];

  if (payload.object !== "instagram") {
    return events;
  }

  for (const entry of payload.entry ?? []) {
    // 1. Process standard changes (comments and mentions)
    for (const change of entry.changes ?? []) {
      if (change.field === "comments" || change.field === "mentions") {
        const value = change.value;
        const commentId = value?.id ?? value?.comment_id ?? `mention_${entry.id}_${Date.now()}`;
        const mediaId = value?.media?.id ?? value?.media_id ?? "mention";
        const commenterId = value?.from?.id;

        if (!entry.id || !commentId || !commenterId) {
          continue;
        }

        events.push({
          instagramAccountId: entry.id,
          commentId,
          commentText: value.text ?? "",
          commenterId,
          commenterName: value.from?.username,
          mediaId,
          eventType: change.field === "mentions" ? "mention" : "comment",
        });
      }
    }

    // 2. Process incoming direct messages (messaging field)
    for (const msg of entry.messaging ?? []) {
      if (msg.message && msg.message.text && msg.sender?.id && msg.recipient?.id) {
        // Skip self-sent messages
        if (msg.sender.id === entry.id) continue;

        events.push({
          instagramAccountId: entry.id,
          commentId: msg.message.mid,
          commentText: msg.message.text,
          commenterId: msg.sender.id,
          mediaId: "direct_message",
          eventType: "message",
        });
      }
    }
  }

  return events;
}
