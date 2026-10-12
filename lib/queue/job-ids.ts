import { createHash } from "node:crypto";

// Hash the tuple so provider IDs cannot introduce BullMQ separators or collisions.
export function commentJobId(accountId: string, commentId: string, retry = 0) {
  const digest = createHash("sha256")
    .update(JSON.stringify([accountId, commentId, retry]))
    .digest("hex");
  return `comment-${digest}`;
}
