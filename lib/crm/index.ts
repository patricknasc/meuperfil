import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import type { Prisma } from "@/app/generated/prisma/client";
import type { CaptureLeadInput } from "./types";
export * from "./types";

export const leadStatusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]);
const captureSchema = z.object({
  workspaceId: z.string().min(1),
  source: z.enum(["BIO_LINK", "INSTAGRAM_DM", "CAMPAIGN", "MANUAL", "IMPORT"]),
  sourceId: z.string().min(1).optional(), interactionKey: z.string().min(1).optional(),
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().toLowerCase().email().optional(), phone: z.string().trim().min(3).max(40).optional(),
  instagramUsername: z.string().trim().max(100).optional(), instagramId: z.string().min(1).max(200).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
}).refine((input) => Boolean(input.instagramId || input.email || input.phone), "Informe uma identidade de contato.");

export async function captureLeadFromInteraction(input: CaptureLeadInput): Promise<{ success: boolean; contactId: string }> {
  const data = captureSchema.parse(input);
  const identityKey = data.instagramId ? `instagram:${data.instagramId}` : data.email ? `email:${data.email}` : `phone:${data.phone}`;
  const eventKey = createHash("sha256").update(JSON.stringify([data.workspaceId, data.source, data.sourceId, data.interactionKey ?? randomUUID()])).digest("hex");
  return prisma.$transaction(async (tx) => {
    let automationId: string | null = null;
    if (data.source === "CAMPAIGN" || data.source === "INSTAGRAM_DM") {
      const campaign = data.sourceId ? await tx.automation.findFirst({ where: { id: data.sourceId, workspaceId: data.workspaceId }, select: { id: true } }) : null;
      if (!campaign) throw new Error("Campanha não encontrada neste workspace.");
      automationId = campaign.id;
    } else if (data.source === "BIO_LINK") {
      const profile = data.sourceId ? await tx.profile.findFirst({ where: { id: data.sourceId, workspaceId: data.workspaceId }, select: { id: true } }) : null;
      if (!profile) throw new Error("Perfil não encontrado neste workspace.");
    }
    const { interactionKey: _interactionKey, customFields, ...contactData } = data;
    void _interactionKey;
    const contact = await tx.contact.upsert({
      where: { workspaceId_identityKey: { workspaceId: data.workspaceId, identityKey } },
      create: { ...contactData, identityKey, customFields: customFields as Prisma.InputJsonValue | undefined },
      // Preserve qualification, tags, original attribution and manually edited names.
      update: { lastInteractionAt: new Date() },
    });
    await tx.leadInteraction.upsert({
      where: { eventKey },
      create: { eventKey, workspaceId: data.workspaceId, contactId: contact.id, source: data.source, sourceId: data.sourceId, automationId },
      update: { eventKey },
    });
    return { success: true, contactId: contact.id };
  });
}

export async function listWorkspaceLeads(workspaceId: string, filters: { search?: string; status?: z.infer<typeof leadStatusSchema>; campaignId?: string; page?: number } = {}) {
  const where: Prisma.ContactWhereInput = {
    workspaceId, status: filters.status,
    ...(filters.campaignId ? { interactions: { some: { workspaceId, automationId: filters.campaignId } } } : {}),
    ...(filters.search ? { OR: ["name", "email", "instagramUsername", "phone"].map((field) => ({ [field]: { contains: filters.search, mode: "insensitive" } })) } : {}),
  };
  return prisma.contact.findMany({
    where, orderBy: [{ lastInteractionAt: "desc" }, { id: "asc" }], take: 50, skip: ((filters.page ?? 1) - 1) * 50,
    include: { interactions: { where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 5, include: { automation: { select: { id: true, name: true, postUrl: true } } } } },
  });
}
