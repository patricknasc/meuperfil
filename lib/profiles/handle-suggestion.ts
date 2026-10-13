import { prisma } from "@/lib/db/client";
import { isValidHandle } from "@/lib/profiles/validation";

/** Turns an Instagram username or email local part into a handle candidate. */
export function toHandleCandidate(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

/**
 * Suggests a free handle, preferring the workspace's connected Instagram
 * username and falling back to the user's email local part. Adds a numeric
 * suffix when the base is taken.
 */
export async function suggestHandle(workspaceId: string, userId: string): Promise<string | null> {
  const [instagram, user] = await Promise.all([
    prisma.instagramAccount.findFirst({
      where: { workspaceId },
      orderBy: { connectedAt: "asc" },
      select: { username: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  const bases = [instagram?.username, user?.email?.split("@")[0]]
    .filter((value): value is string => Boolean(value))
    .map(toHandleCandidate)
    .filter((base) => base.length >= 3);

  for (const base of bases) {
    for (let suffix = 0; suffix < 10; suffix++) {
      const candidate = suffix === 0 ? base : `${base.slice(0, 28)}${suffix + 1}`;
      if (!isValidHandle(candidate)) continue;
      const taken = await prisma.profile.findUnique({ where: { handle: candidate }, select: { id: true } });
      if (!taken) return candidate;
    }
  }
  return null;
}
