import { z } from "zod";

export const postMediaTypeEnum = z.enum(["IMAGE", "VIDEO", "CAROUSEL", "REEL", "STORY"]);
export const postPlatformEnum = z.enum(["INSTAGRAM", "FACEBOOK", "TIKTOK", "TWITTER", "LINKEDIN"]);
export const postStatusEnum = z.enum(["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"]);

function isValidHttpUrl(string: string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const createScheduledPostSchema = z.object({
  instagramAccountId: z.string().min(1, "Selecione uma conta do Instagram"),
  caption: z.string().max(2200, "A legenda não pode ultrapassar 2.200 caracteres").optional().nullable(),
  mediaUrls: z.array(z.string().refine(isValidHttpUrl, "URL de mídia inválida")).min(1, "Envie pelo menos uma mídia"),
  mediaType: postMediaTypeEnum.default("IMAGE"),
  platform: postPlatformEnum.default("INSTAGRAM"),
  scheduledFor: z.string().datetime().optional().nullable(), // ISO String
  publishNow: z.boolean().default(false),
  
  // Auto-campaign
  autoCampaignEnabled: z.boolean().default(false),
  autoCampaignKeywords: z.array(z.string().min(1)).optional().default([]),
  autoCampaignDmMessage: z.string().max(1000).optional().nullable(),
}).refine((data) => {
  if (data.mediaType === "CAROUSEL" && data.mediaUrls.length < 2) {
    return false;
  }
  return true;
}, {
  message: "Carrossel precisa de no mínimo 2 mídias",
  path: ["mediaUrls"],
}).refine((data) => {
  if (data.mediaType === "CAROUSEL" && data.mediaUrls.length > 10) {
    return false;
  }
  return true;
}, {
  message: "Carrossel aceita no máximo 10 mídias",
  path: ["mediaUrls"],
}).refine((data) => {
  if (!data.publishNow && data.scheduledFor) {
    const schedDate = new Date(data.scheduledFor);
    // Allow small margin (1 minute in the past for clock drift)
    return schedDate.getTime() > Date.now() - 60_000;
  }
  return true;
}, {
  message: "A data de agendamento deve ser no futuro",
  path: ["scheduledFor"],
}).refine((data) => {
  if (data.autoCampaignEnabled) {
    return (data.autoCampaignKeywords && data.autoCampaignKeywords.length > 0) && !!data.autoCampaignDmMessage?.trim();
  }
  return true;
}, {
  message: "Para ativar a automação, informe ao menos uma palavra-chave e a mensagem de DM",
  path: ["autoCampaignKeywords"],
});

export const updateScheduledPostSchema = z.object({
  caption: z.string().max(2200).optional().nullable(),
  mediaUrls: z.array(z.string().refine(isValidHttpUrl, "URL de mídia inválida")).optional(),
  mediaType: postMediaTypeEnum.optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  status: postStatusEnum.optional(),
  autoCampaignEnabled: z.boolean().optional(),
  autoCampaignKeywords: z.array(z.string()).optional(),
  autoCampaignDmMessage: z.string().max(1000).optional().nullable(),
});

export type CreateScheduledPostInput = z.infer<typeof createScheduledPostSchema>;
export type UpdateScheduledPostInput = z.infer<typeof updateScheduledPostSchema>;
