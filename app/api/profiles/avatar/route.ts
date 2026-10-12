import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";

export async function POST(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  if (!canManageWorkspace(context.role)) {
    return NextResponse.json(
      { success: false, error: "Permissão insuficiente no workspace" },
      { status: 403 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { imageData } = await request.json();
      if (!imageData || typeof imageData !== "string") {
        return NextResponse.json(
          { success: false, error: "Dados de imagem inválidos" },
          { status: 400 }
        );
      }

      // Check max size (approx 2MB for base64)
      if (imageData.length > 2.5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "A imagem não pode exceder 2MB" },
          { status: 400 }
        );
      }

      // Data URL validation
      if (!imageData.startsWith("data:image/") && !imageData.startsWith("https://")) {
        return NextResponse.json(
          { success: false, error: "Formato de imagem inválido (use JPEG/PNG/WebP ou URL HTTPS)" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          url: imageData,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Content-Type não suportado" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar avatar" },
      { status: 500 }
    );
  }
}
