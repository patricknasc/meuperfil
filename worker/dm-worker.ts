import { createDMWorker } from "@/lib/queue/dm-worker";
import { createPostPublisherWorker, reconcileScheduledPosts } from "@/lib/queue/post-worker";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
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

void heartbeat();
const heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`[Worker] ${signal} received, closing workers`);
  clearInterval(heartbeatTimer);
  clearInterval(reconciliationTimer);
  await Promise.allSettled([
    dmWorker.close(),
    postWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

