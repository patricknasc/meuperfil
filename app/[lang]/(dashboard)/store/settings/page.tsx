import { redirect } from "next/navigation";
import { getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { ensureStore } from "@/lib/store/service";
import { StoreSettingsForm } from "@/components/store/store-settings-form";

export default async function StoreSettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const context = await getCurrentWorkspaceContext();
  if (!context) redirect(`/${lang}/login`);

  const store = await ensureStore(context.workspaceId, context.workspace.name);
  return <StoreSettingsForm lang={lang} store={store} />;
}
