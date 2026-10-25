import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Public media storage for store images.
 *
 * HM/PD use Supabase Storage (bucket "store-media", public read) through its
 * REST API with the service role key. Local development without those
 * variables writes to public/uploads so the catalog works offline.
 */

export const MEDIA_BUCKET = "store-media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_SIGNATURES: Array<{ type: string; ext: string; matches: (b: Uint8Array) => boolean }> = [
  { type: "image/jpeg", ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    ext: "png",
    matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    type: "image/webp",
    ext: "webp",
    matches: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
];

/** Detects JPEG/PNG/WebP from the file's first bytes; the declared type is not trusted. */
export function detectImageType(bytes: Uint8Array): { type: string; ext: string } | null {
  const match = IMAGE_SIGNATURES.find((sig) => bytes.length >= 12 && sig.matches(bytes));
  return match ? { type: match.type, ext: match.ext } : null;
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

function storesLocally() {
  return !supabaseConfig() && process.env.NODE_ENV !== "production";
}

export function publicMediaUrl(storagePath: string): string {
  const config = supabaseConfig();
  return config && !storesLocally()
    ? `${config.url}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`
    : `/uploads/${MEDIA_BUCKET}/${storagePath}`;
}

const STORAGE_PATH = /^[a-z0-9]+\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** True when the path was produced by uploadImage for this workspace. */
export function isWorkspaceMediaPath(workspaceId: string, storagePath: string): boolean {
  return STORAGE_PATH.test(storagePath) && storagePath.startsWith(`${workspaceId}/`);
}

export interface StoredMedia {
  url: string;
  storagePath: string;
}

export async function uploadImage(
  workspaceId: string,
  bytes: Uint8Array,
  ext: string,
  contentType: string
): Promise<StoredMedia> {
  const storagePath = `${workspaceId}/${randomUUID()}.${ext}`;

  if (storesLocally()) {
    const filePath = path.join(process.cwd(), "public", "uploads", MEDIA_BUCKET, storagePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);
    return { url: publicMediaUrl(storagePath), storagePath };
  }

  const config = supabaseConfig();
  if (!config) throw new Error("Armazenamento de imagens não configurado");

  const response = await fetch(`${config.url}/storage/v1/object/${MEDIA_BUCKET}/${storagePath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
      "Content-Type": contentType,
      "Cache-Control": "31536000",
    },
    body: Buffer.from(bytes),
  });
  if (!response.ok) {
    throw new Error(`Falha ao enviar imagem (${response.status})`);
  }

  return { url: publicMediaUrl(storagePath), storagePath };
}

/** Best-effort removal; a leftover file is harmless, a failed DB write is not. */
export async function deleteImages(storagePaths: string[]): Promise<void> {
  const paths = storagePaths.filter(Boolean);
  if (!paths.length) return;

  try {
    if (storesLocally()) {
      await Promise.all(
        paths.map((p) =>
          unlink(path.join(process.cwd(), "public", "uploads", MEDIA_BUCKET, p)).catch(() => undefined)
        )
      );
      return;
    }

    const config = supabaseConfig();
    if (!config) return;
    await fetch(`${config.url}/storage/v1/object/${MEDIA_BUCKET}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.key}`,
        apikey: config.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: paths }),
    });
  } catch (error) {
    console.error("Error deleting store images:", error);
  }
}
