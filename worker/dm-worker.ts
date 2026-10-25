import { createDMWorker } from "@/lib/queue/dm-worker";
import { createPostPublisherWorker, reconcileScheduledPosts } from "@/lib/queue/post-worker";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
import { refreshExpiringInstagramTokens, resetMonthlyUsage } from "@/lib/meta/token-refresh";
import { expireStaleOrders } from "@/lib/store/orders";
import os from "node:os";

const dmWorker = createDMWorker();
const postWorker = createPostPublisherWorker();
const startedAt = new Date().toISOString();
const HEARTBEAT_INTERVAL_MS = 30_000;

console.log("[Worker] DM Worker & Post Publisher Worker Started");

async function heartbeat() {
  try {
    await recordWorkerHeartbeat({
      pid: process.pid,
      hostname: os.hostname(),
      startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Worker] Heartbeat failed:", message);
  }
}

let reconciliationRunning = false;
async function reconcile() {
  if (reconciliationRunning) return;
  reconciliationRunning = true;
  try { await reconcileScheduledPosts(); }
  catch (error) { console.error("[Worker] Schedule reconciliation failed", error); }
  finally { reconciliationRunning = false; }
}
void reconcile();
const reconciliationTimer = setInterval(() => void reconcile(), HEARTBEAT_INTERVAL_MS);

// Instagram tokens and monthly usage: runs at startup and every 6 hours, in
// every environment (the Vercel cron only exists in production).
const MAINTENANCE_INTERVAL_MS = 6 * 60 * 60 * 1000;
async function maintenance() {
  try {
    await resetMonthlyUsage();
    const results = await refreshExpiringInstagramTokens();
    if (results.length > 0) {
      const failed = results.filter((r) => r.status === "failed").length;
      console.log(`[Worker] Token refresh: ${results.length - failed} refreshed, ${failed} failed`);
    }
  } catch (error) {
    console.error("[Worker] Maintenance failed", error);
  }
}
void maintenance();
const maintenanceTimer = setInterval(() => void maintenance(), MAINTENANCE_INTERVAL_MS);

// Store: cancel unpaid orders past their deadline so reserved stock returns.
const ORDER_EXPIRY_INTERVAL_MS = 5 * 60 * 1000;
async function expireOrders() {
  try {
    const expired = await expireStaleOrders();
    if (expired > 0) console.log(`[Worker] Store: ${expired} unpaid orders expired`);
  } catch (error) {
    console.error("[Worker] Store order expiry failed", error);
  }
}
void expireOrders();
const orderExpiryTimer = setInterval(() => void expireOrders(), ORDER_EXPIRY_INTERVAL_MS);

void heartbeat();
const heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`[Worker] ${signal} received, closing workers`);
  clearInterval(heartbeatTimer);
  clearInterval(reconciliationTimer);
  clearInterval(maintenanceTimer);
  clearInterval(orderExpiryTimer);
  await Promise.allSettled([
    dmWorker.close(),
    postWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

