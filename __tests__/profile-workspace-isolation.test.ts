import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma client
vi.mock("@/lib/db/client", () => {
  return {
    prisma: {
      profile: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      profileBlock: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      workspace: {
        findUnique: vi.fn(),
      },
    },
  };
});

import { prisma } from "@/lib/db/client";
import { getProfilesForWorkspace, getProfileById, deleteProfile } from "@/lib/profiles/service";

describe("Profile Workspace Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters profiles strictly by workspaceId", async () => {
    const mockFindMany = vi.mocked(prisma.profile.findMany);
    mockFindMany.mockResolvedValue([]);

    await getProfilesForWorkspace("workspace_123");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: "workspace_123" },
      })
    );
  });

  it("prevents accessing a profile from another workspace", async () => {
    const mockFindFirst = vi.mocked(prisma.profile.findFirst);
    mockFindFirst.mockResolvedValue(null);

    const result = await getProfileById("profile_abc", "workspace_attacker");

    expect(result).toBeNull();
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "profile_abc",
          workspaceId: "workspace_attacker",
        },
      })
    );
  });

  it("throws error when trying to delete a profile belonging to another workspace", async () => {
    const mockFindFirst = vi.mocked(prisma.profile.findFirst);
    mockFindFirst.mockResolvedValue(null);

    await expect(deleteProfile("profile_abc", "workspace_unauthorized")).rejects.toThrow(
      "Perfil não encontrado no workspace"
    );
  });
});
