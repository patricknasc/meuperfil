import { notFound, redirect } from "next/navigation";
import { getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { getOrderForOwner } from "@/lib/store/orders";
import { OrderDetail } from "@/components/store/order-detail";

export default async function StoreOrderPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const context = await getCurrentWorkspaceContext();
  if (!context) redirect(`/${lang}/login`);

  const order = await getOrderForOwner(context.workspaceId, id);
  if (!order) notFound();
  return <OrderDetail lang={lang} initialOrder={order} />;
}
