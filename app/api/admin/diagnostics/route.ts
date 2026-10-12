import { NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { prisma } from "@/lib/db/client";

import { getWorkerHealth } from "@/lib/ops/worker-health";

export const runtime = "nodejs";

export async function GET() {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!canManageWorkspace(context.role)) {
    return NextResponse.json({ success: false, error: "Permissão insuficiente no workspace" }, { status: 403 });
  }
  const { workspaceId } = context;
  const [
    queueCounts,
    workerHealth,
    workerAlerts,
    webhookFailures,
    billingEvents,
    dmFailures,
    tokenRefreshFailures,
    operationalEvents,
  ] = await Promise.all([
    prisma.dmLog.groupBy({ by: ["status"], where: { workspaceId }, _count: { _all: true } }),
    getWorkerHealth(),
    prisma.operationalEvent.findMany({ where: { workspaceId, source: "WORKER", level: { in: ["WARNING", "ERROR"] } }, orderBy: { createdAt: "desc" }, take: 10, select: { level: true, message: true, createdAt: true } }),
    prisma.webhookEvent.findMany({
      where: { workspaceId, status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        object: true,
        errorMessage: true,
        createdAt: true,
        processedAt: true,
      },
    }),
    prisma.billingEvent.findMany({
      where: { workspaceId },
      orderBy: { processedAt: "desc" },
      take: 10,
      select: {
        id: true,
        stripeEventId: true,
        type: true,
        processedAt: true,
      },
    }),
    prisma.dmLog.findMany({
      where: {
        workspaceId,
        status: {
          in: [
            "FAILED",
            "SKIPPED_RATE_LIMIT",
            "SKIPPED_PLAN_LIMIT",
            "SKIPPED_NO_MATCH",
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        commentId: true,
        commentText: true,
        errorMessage: true,
        updatedAt: true,
        automation: { select: { name: true } },
      },
    }),
    prisma.operationalEvent.findMany({
      where: { workspaceId, source: "TOKEN_REFRESH", level: "ERROR" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        message: true,
        createdAt: true,
        payload: true,
      },
    }),
    prisma.operationalEvent.findMany({
      where: {
        workspaceId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        source: true,
        level: true,
        message: true,
        createdAt: true,
        resolvedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      queueCounts: Object.fromEntries(queueCounts.map((row) => [row.status.toLowerCase(), row._count._all])),
      workerHealth: { healthy: workerHealth.healthy, ageMs: workerHealth.ageMs, heartbeat: workerHealth.heartbeat ? { checkedAt: workerHealth.heartbeat.checkedAt } : null },
      workerAlerts,
      webhookFailures,
      billingEvents,
      dmFailures,
      tokenRefreshFailures,
      operationalEvents,
    },
  });
}
