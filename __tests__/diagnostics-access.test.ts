import { beforeEach, describe, expect, it, vi } from "vitest";
const { context, db, health } = vi.hoisted(() => ({ context: vi.fn(), db: {
  dmLog: { groupBy: vi.fn(), findMany: vi.fn() }, webhookEvent: { findMany: vi.fn() }, billingEvent: { findMany: vi.fn() }, operationalEvent: { findMany: vi.fn() },
}, health: vi.fn() }));
vi.mock("@/lib/workspace-access", () => ({ getCurrentWorkspaceContext: context, canManageWorkspace: (role: string) => role === "ADMIN" || role === "OWNER" }));
vi.mock("@/lib/db/client", () => ({ prisma: db }));
vi.mock("@/lib/ops/worker-health", () => ({ getWorkerHealth: health }));
import { GET } from "@/app/api/admin/diagnostics/route";
describe("Workspace diagnostics access", () => {
  beforeEach(() => { vi.resetAllMocks(); for (const model of Object.values(db)) for (const method of Object.values(model)) method.mockResolvedValue([]); });
  it("rejects anonymous users and members before fetching operational data", async () => {
    context.mockResolvedValue(null); expect((await GET()).status).toBe(401);
    context.mockResolvedValue({ workspaceId: "w1", role: "MEMBER" }); expect((await GET()).status).toBe(403);
    expect(health).not.toHaveBeenCalled();
  });
  it("filters all events to the workspace and omits infrastructure identity", async () => {
    context.mockResolvedValue({ workspaceId: "w1", role: "ADMIN" });
    health.mockResolvedValue({ healthy: true, ageMs: 0, heartbeat: { checkedAt: "now", hostname: "internal-host", pid: 321 } });
    const payload = await (await GET()).json();
    expect(payload.data.workerHealth.heartbeat).toEqual({ checkedAt: "now" });
    for (const model of Object.values(db)) for (const method of Object.values(model)) for (const [args] of method.mock.calls) expect(args.where.workspaceId).toBe("w1");
  });
});
