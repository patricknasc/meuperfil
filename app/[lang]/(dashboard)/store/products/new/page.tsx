import { redirect } from "next/navigation";
import { getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { ensureStore, listCategories } from "@/lib/store/service";
import { ProductForm } from "@/components/store/product-form";

export default async function NewProductPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const context = await getCurrentWorkspaceContext();
  if (!context) redirect(`/${lang}/login`);

  await ensureStore(context.workspaceId, context.workspace.name);
  const categories = await listCategories(context.workspaceId);
  return <ProductForm lang={lang} categories={categories} />;
}
