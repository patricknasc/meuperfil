import { NextRequest, NextResponse } from "next/server";
import { refreshExpiringInstagramTokens, resetMonthlyUsage } from "@/lib/meta/token-refresh";

// Backup trigger (Vercel cron, production only). The worker runs the same
// refresh every 6 hours in every environment.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspacesReset = await resetMonthlyUsage();
  const results = await refreshExpiringInstagramTokens();

  return NextResponse.json({
    success: true,
    data: {
      totalProcessed: results.length,
      workspacesReset,
      results,
    },
  });
}
