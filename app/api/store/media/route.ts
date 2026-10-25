import { NextRequest, NextResponse } from "next/server";
import { withStoreOwner } from "@/lib/store/api";
import { detectImageType, MAX_IMAGE_BYTES, uploadImage } from "@/lib/storage/media";

export async function POST(request: NextRequest) {
  return withStoreOwner("enviar a imagem", async (context) => {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Selecione uma imagem");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("A imagem não pode passar de 5 MB");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectImageType(bytes);
    if (!detected) throw new Error("Formato não suportado. Use JPEG, PNG ou WebP.");

    const media = await uploadImage(context.workspaceId, bytes, detected.ext, detected.type);
    return NextResponse.json({ success: true, data: media }, { status: 201 });
  });
}
