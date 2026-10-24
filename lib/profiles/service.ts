import { prisma } from "@/lib/db/client";
import { Prisma, ProfileTheme, ProfileBlockType } from "@/app/generated/prisma/client";
import { canCreateProfileForWorkspace, canAddBlockToProfile } from "@/lib/billing/profile-limits";
import { sanitizeHandle, isValidDestinationUrl } from "@/lib/profiles/validation";
import { isSafeSocialUrl } from "@/lib/profiles/links";
import type { VisitContext } from "@/lib/tracking/visitor";
import type { CustomThemeSettings } from "@/lib/profiles/themes";

export interface CreateProfileInput {
  handle: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  theme?: ProfileTheme;
  isPublished?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateProfileInput {
  handle?: string;
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  theme?: ProfileTheme;
  themeSettings?: CustomThemeSettings | null;
  isPublished?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CreateBlockInput {
  type: ProfileBlockType;
  title: string;
  url?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  config?: Prisma.InputJsonValue | null;
}

export interface UpdateBlockInput {
  title?: string;
  url?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  config?: Prisma.InputJsonValue | null;
}

/**
 * List all profiles for a given workspace
 */
export async function getProfilesForWorkspace(workspaceId: string) {
  return prisma.profile.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: {
          blocks: true,
          visits: true,
          clicks: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a profile by ID with strict workspace isolation
 */
export async function getProfileById(profileId: string, workspaceId: string) {
  return prisma.profile.findFirst({
    where: {
      id: profileId,
      workspaceId,
    },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: { clicks: true },
          },
        },
      },
      _count: {
        select: {
          visits: true,
          clicks: true,
        },
      },
    },
  });
}

/**
 * Get a public profile by unique handle
 */
export async function getPublicProfileByHandle(handle: string) {
  const sanitized = sanitizeHandle(handle);
  return prisma.profile.findUnique({
    where: { handle: sanitized },
    include: {
      blocks: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

/**
 * Check if a handle is already taken by another profile
 */
export async function isHandleTaken(handle: string, excludeProfileId?: string): Promise<boolean> {
  const sanitized = sanitizeHandle(handle);
  const existing = await prisma.profile.findUnique({
    where: { handle: sanitized },
    select: { id: true },
  });

  if (!existing) return false;
  if (excludeProfileId && existing.id === excludeProfileId) return false;
  return true;
}

/**
 * Create a new profile within a workspace
 */
export async function createProfile(workspaceId: string, input: CreateProfileInput) {
  const canCreate = await canCreateProfileForWorkspace(workspaceId);
  if (!canCreate.allowed) {
    throw new Error(`Limite de perfis atingido para seu plano (${canCreate.limit} perfis).`);
  }

  const handle = sanitizeHandle(input.handle);
  const taken = await isHandleTaken(handle);
  if (taken) {
    throw new Error("Este handle já está em uso por outro usuário.");
  }

  return prisma.profile.create({
    data: {
      workspaceId,
      handle,
      displayName: input.displayName,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      theme: input.theme ?? ProfileTheme.MODERN_DARK,
      isPublished: input.isPublished ?? true,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    },
  });
}

/**
 * Update an existing profile with workspace check
 */
export async function updateProfile(
  profileId: string,
  workspaceId: string,
  input: UpdateProfileInput
) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, workspaceId },
  });

  if (!profile) {
    throw new Error("Perfil não encontrado no workspace");
  }

  const data: Prisma.ProfileUpdateInput = {};
  if (input.displayName !== undefined) data.displayName = input.displayName;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
  if (input.theme !== undefined) data.theme = input.theme;
  if (input.themeSettings !== undefined) {
    data.themeSettings = input.themeSettings === null ? Prisma.DbNull : { ...input.themeSettings };
  }
  if (input.isPublished !== undefined) data.isPublished = input.isPublished;
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;

  if (input.handle !== undefined) {
    const handle = sanitizeHandle(input.handle);
    const taken = await isHandleTaken(handle, profileId);
    if (taken) {
      throw new Error("Este handle já está em uso por outro usuário.");
    }
    data.handle = handle;
  }

  return prisma.profile.update({
    where: { id: profileId },
    data,
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

/**
 * Delete a profile
 */
export async function deleteProfile(profileId: string, workspaceId: string) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, workspaceId },
  });

  if (!profile) {
    throw new Error("Perfil não encontrado no workspace");
  }

  return prisma.profile.delete({
    where: { id: profileId },
  });
}

/**
 * Create a block for a profile
 */
export async function createBlock(
  profileId: string,
  workspaceId: string,
  input: CreateBlockInput
) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, workspaceId },
  });

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  const canAdd = await canAddBlockToProfile(profileId, workspaceId);
  if (!canAdd.allowed) {
    throw new Error(`Limite de blocos atingido para seu plano (${canAdd.limit} blocos).`);
  }

  if (input.url && !isValidDestinationUrl(input.url)) {
    throw new Error("URL de destino inválida. Deve iniciar com http:// ou https://");
  }

  // Find max sortOrder to append to bottom if not specified
  const maxOrder = await prisma.profileBlock.findFirst({
    where: { profileId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const sortOrder = input.sortOrder ?? (maxOrder ? maxOrder.sortOrder + 1 : 0);

  return prisma.profileBlock.create({
    data: {
      profileId,
      type: input.type,
      title: input.title,
      url: input.url,
      description: input.description,
      imageUrl: input.imageUrl,
      isActive: input.isActive ?? true,
      sortOrder,
      config: input.config ?? undefined,
    },
  });
}

/**
 * Update a block
 */
export async function updateBlock(
  blockId: string,
  workspaceId: string,
  input: UpdateBlockInput
) {
  const block = await prisma.profileBlock.findFirst({
    where: {
      id: blockId,
      profile: { workspaceId },
    },
  });

  if (!block) {
    throw new Error("Bloco não encontrado");
  }

  if (input.url && !isValidDestinationUrl(input.url)) {
    throw new Error("URL de destino inválida. Deve iniciar com http:// ou https://");
  }

  const data: Prisma.ProfileBlockUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.url !== undefined) data.url = input.url;
  if (input.description !== undefined) data.description = input.description;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.config !== undefined) data.config = input.config === null ? Prisma.DbNull : input.config;

  return prisma.profileBlock.update({
    where: { id: blockId },
    data,
  });
}

/**
 * Delete a block
 */
export async function deleteBlock(blockId: string, workspaceId: string) {
  const block = await prisma.profileBlock.findFirst({
    where: {
      id: blockId,
      profile: { workspaceId },
    },
  });

  if (!block) {
    throw new Error("Bloco não encontrado");
  }

  return prisma.profileBlock.delete({
    where: { id: blockId },
  });
}

/**
 * Reorder blocks for a profile
 */
export async function reorderBlocks(
  profileId: string,
  workspaceId: string,
  blockIds: string[]
) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, workspaceId },
  });

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  // Update sortOrder sequentially inside a transaction
  return prisma.$transaction(
    blockIds.map((id, index) =>
      prisma.profileBlock.updateMany({
        where: { id, profileId },
        data: { sortOrder: index },
      })
    )
  );
}

/**
 * Record a public profile visit
 */
export async function recordProfileVisit(
  profileId: string,
  workspaceId: string,
  meta: {
    ipHash?: string | null;
    userAgent?: string | null;
    referrer?: string | null;
  } & Partial<VisitContext>
) {
  try {
    return await prisma.profileVisit.create({
      data: {
        profileId,
        workspaceId,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
        country: meta.country,
        region: meta.region,
        city: meta.city,
        utmSource: meta.utmSource,
        utmMedium: meta.utmMedium,
        utmCampaign: meta.utmCampaign,
      },
    });
  } catch (error) {
    console.error("Error recording profile visit:", error);
    return null;
  }
}

/**
 * Record a public block click and return destination URL
 */
export async function recordBlockClick(
  blockId: string,
  meta: {
    ipHash?: string | null;
    userAgent?: string | null;
    referrer?: string | null;
  } & Partial<VisitContext>,
  /** Position of the clicked icon in a SOCIAL_LINKS block. */
  linkIndex?: number
) {
  const block = await prisma.profileBlock.findUnique({
    where: { id: blockId },
    include: {
      profile: {
        select: {
          id: true,
          workspaceId: true,
          isPublished: true,
        },
      },
    },
  });

  if (!block || !block.isActive || !block.profile.isPublished) {
    return null;
  }

  let destinationUrl: string | null = null;
  if (block.type === ProfileBlockType.SOCIAL_LINKS) {
    const links = (block.config as { links?: Array<{ url?: unknown }> } | null)?.links ?? [];
    const url = links[linkIndex ?? 0]?.url;
    if (typeof url === "string" && isSafeSocialUrl(url)) destinationUrl = url;
  } else if (block.url && isValidDestinationUrl(block.url)) {
    destinationUrl = block.url;
  }

  if (!destinationUrl) {
    return null;
  }

  try {
    await prisma.profileBlockClick.create({
      data: {
        profileId: block.profile.id,
        blockId: block.id,
        workspaceId: block.profile.workspaceId,
        destinationUrl,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
        country: meta.country,
        region: meta.region,
        city: meta.city,
        utmSource: meta.utmSource,
        utmMedium: meta.utmMedium,
        utmCampaign: meta.utmCampaign,
      },
    });
  } catch (error) {
    console.error("Error recording block click:", error);
  }

  return destinationUrl;
}
