import { z } from "zod";
import { ProfileTheme, ProfileBlockType } from "@/app/generated/prisma/client";

/**
 * System reserved handles that cannot be registered by users
 */
export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "automations",
  "billing",
  "blog",
  "campaigns",
  "checkout",
  "comment-link-automation",
  "dashboard",
  "data-deletion",
  "diagnostics",
  "docs",
  "help",
  "instagram",
  "instagram-comment-to-dm-templates",
  "instagram-dm-automation-agencies",
  "invite",
  "login",
  "logout",
  "logs",
  "manychat-alternative",
  "meta-review",
  "meuperfil",
  "oauth",
  "p",
  "pricing",
  "privacy",
  "profiles",
  "r",
  "reports",
  "root",
  "settings",
  "signin",
  "signout",
  "signup",
  "static",
  "status",
  "templates",
  "terms",
  "webhook",
  "workspaces",
  "www",
]);

/**
 * Handle regex: 3 to 30 characters, letters, numbers, underscores, dashes, dots.
 * Must start and end with alphanumeric.
 */
export const HANDLE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,28}[a-zA-Z0-9]$/;

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.toLowerCase().trim());
}

export function sanitizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .trim()
    .replace(/^@+/, "");
}

export function isValidHandle(handle: string): boolean {
  const sanitized = sanitizeHandle(handle);
  if (sanitized.length < 3 || sanitized.length > 30) return false;
  if (!HANDLE_REGEX.test(sanitized)) return false;
  if (isReservedHandle(sanitized)) return false;
  return true;
}

/**
 * Validates destination URLs to prevent javascript:, data:, file:, etc.
 */
export function isValidDestinationUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const handleSchema = z
  .string()
  .min(3, "O handle deve ter no mínimo 3 caracteres")
  .max(30, "O handle deve ter no máximo 30 caracteres")
  .transform((val) => sanitizeHandle(val))
  .refine(
    (val) => HANDLE_REGEX.test(val),
    "O handle deve conter apenas letras, números, '.', '_' e '-' (sem símbolos especiais no início/fim)"
  )
  .refine((val) => !isReservedHandle(val), "Este handle está reservado pelo sistema");

export const safeUrlSchema = z
  .string()
  .url("URL inválida")
  .refine(isValidDestinationUrl, "A URL deve começar com http:// ou https://");

export const createProfileSchema = z.object({
  handle: handleSchema,
  displayName: z.string().min(1, "Nome de exibição obrigatório").max(60),
  bio: z.string().max(300).optional().nullable(),
  avatarUrl: z.string().max(2000).optional().nullable(),
  theme: z.nativeEnum(ProfileTheme).optional().default(ProfileTheme.MODERN_DARK),
  isPublished: z.boolean().optional().default(true),
  seoTitle: z.string().max(100).optional().nullable(),
  seoDescription: z.string().max(200).optional().nullable(),
});

export const updateProfileSchema = z.object({
  handle: handleSchema.optional(),
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(300).optional().nullable(),
  avatarUrl: z.string().max(2000).optional().nullable(),
  theme: z.nativeEnum(ProfileTheme).optional(),
  isPublished: z.boolean().optional(),
  seoTitle: z.string().max(100).optional().nullable(),
  seoDescription: z.string().max(200).optional().nullable(),
});

export const socialLinkItemSchema = z.object({
  platform: z.enum([
    "instagram",
    "whatsapp",
    "tiktok",
    "youtube",
    "twitter",
    "linkedin",
    "github",
    "facebook",
    "email",
    "telegram",
    "spotify",
    "website",
  ]),
  url: safeUrlSchema,
  label: z.string().max(50).optional(),
});

export const createBlockSchema = z.object({
  type: z.nativeEnum(ProfileBlockType).default(ProfileBlockType.LINK),
  title: z.string().min(1, "Título obrigatório").max(100),
  url: safeUrlSchema.optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  imageUrl: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
  config: z.any().optional().nullable(),
});

export const updateBlockSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  url: safeUrlSchema.optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  imageUrl: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  config: z.any().optional().nullable(),
});

export const reorderBlocksSchema = z.object({
  blockIds: z.array(z.string().min(1)),
});
