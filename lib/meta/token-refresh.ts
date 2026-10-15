import { prisma } from "@/lib/db/client";
import { refreshLongLivedToken } from "@/lib/meta/client";
import { decryptToken, encryptToken } from "@/lib/meta/oauth";

/**
 * Instagram long-lived tokens last 60 days and can be refreshed once they are
 * at least 24h old. Starting 30 days before expiry gives ~120 attempts (worker
 * every 6h) before anything expires, so a few days of Meta errors are harmless.
 */
export const REFRESH_WITHIN_DAYS = 30;

export interface TokenRefreshResult {
  instagramAccountId: string;
  username: string;
  status: "refreshed" | "failed";
  error?: string;
}

export async function refreshExpiringInstagramTokens(now = new Date()): Promise<TokenRefreshResult[]> {
  const cutoff = new Date(now.getTime() + REFRESH_WITHIN_DAYS * 86_400_000);

  const accounts = await prisma.instagramAccount.findMany({
    where: { accessToken: { not: "" }, tokenExpiresAt: { not: null, lte: cutoff } },
    select: { id: true, workspaceId: true, username: true, accessToken: true, tokenExpiresAt: true },
  });

  const results: TokenRefreshResult[] = [];
  for (const account of accounts) {
    try {
      const { accessToken, expiresIn } = await refreshLongLivedToken(decryptToken(account.accessToken));
      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(accessToken),
          tokenExpiresAt: new Date(now.getTime() + expiresIn * 1000),
        },
      });
      results.push({ instagramAccountId: account.id, username: account.username, status: "refreshed" });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      const expired = account.tokenExpiresAt !== null && account.tokenExpiresAt <= now;
      await prisma.operationalEvent.create({
        data: {
          workspaceId: account.workspaceId,
          source: "TOKEN_REFRESH",
          level: "ERROR",
          message: expired
            ? `Instagram token for @${account.username} expired; reconnect the account. Last error: ${error}`
            : `Token refresh failed for @${account.username} (will retry): ${error}`,
          payload: {
            instagramAccountId: account.id,
            username: account.username,
            tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
          },
        },
      });
      results.push({ instagramAccountId: account.id, username: account.username, status: "failed", error });
    }
  }
  return results;
}

/** Starts a new monthly DM usage period for workspaces still on last month. */
export async function resetMonthlyUsage(now = new Date()): Promise<number> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const reset = await prisma.workspace.updateMany({
    where: { usagePeriodStart: { lt: monthStart } },
    data: { usagePeriodStart: monthStart, dmsSentThisPeriod: 0 },
  });
  return reset.count;
}
