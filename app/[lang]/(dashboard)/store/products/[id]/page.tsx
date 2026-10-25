import { notFound, redirect } from "next/navigation";
import { getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { getProduct, listCategories } from "@/lib/store/service";
import { ProductForm } from "@/components/store/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const context = await getCurrentWorkspaceContext();
  if (!context) redirect(`/${lang}/login`);

  const [product, categories] = await Promise.all([getProduct(context.workspaceId, id), listCategories(context.workspaceId)]);
  if (!product) notFound();
  return <ProductForm lang={lang} categories={categories} product={product} />;
}
