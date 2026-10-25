import { StoreAdminTabs } from "@/components/store/admin-tabs";

export default async function StoreAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <div className="space-y-6 animate-fade-in">
      <StoreAdminTabs lang={lang} />
      {children}
    </div>
  );
}
