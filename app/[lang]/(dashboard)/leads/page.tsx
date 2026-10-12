import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceContext, canManageWorkspace } from "@/lib/workspace-access";
import { leadStatusSchema, listWorkspaceLeads } from "@/lib/crm";
import { dashboardMessages } from "@/lib/i18n/dashboard";
import LeadStatusSelect from "@/components/lead-status-select";
export default async function LeadsPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { lang } = await params;
  const locale = lang === "en" || lang === "es" ? lang : "pt";
  const t = dashboardMessages(locale);
  const context = await getCurrentWorkspaceContext();
  if (!context) redirect(`/${locale}/login`);
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search.slice(0, 200) : "";
  const status = leadStatusSchema.safeParse(query.status);
  const campaignId = typeof query.campaignId === "string" ? query.campaignId : undefined;
  const pageNumber = typeof query.page === "string" ? Number(query.page) : 1;
  const page = Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= 10000 ? pageNumber : 1;
  const contacts = await listWorkspaceLeads(context.workspaceId, { search, status: status.success ? status.data : undefined, campaignId, page });
  function pageUrl(target: number) {
    const values = new URLSearchParams({ page: String(target), search });
    if (status.success) values.set("status", status.data);
    if (campaignId) values.set("campaignId", campaignId);
    return `/${locale}/leads?${values}`;
  }
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">{t.leads}</h1><p className="mt-2 text-sm text-muted">{t.leadDescription}</p></div>
    <form className="flex flex-wrap gap-3">
      <input name="search" defaultValue={search} placeholder={t.search} aria-label={t.search} className="min-w-64 flex-1 rounded-xl border border-border bg-surface px-4 py-2" />
      {campaignId && <input type="hidden" name="campaignId" value={campaignId} />}
      <select name="status" defaultValue={status.success ? status.data : ""} aria-label={t.status} className="rounded-xl border border-border bg-surface px-3 py-2"><option value="">{t.all}</option>{leadStatusSchema.options.map((value) => <option key={value} value={value}>{t[value]}</option>)}</select>
      <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-black">{t.searchButton}</button>
    </form>
    {!contacts.length ? <p className="glass rounded-xl p-8 text-muted">{t.empty}</p> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm">
      <thead className="bg-surface text-muted"><tr>{[t.person, t.campaign, t.lastInteraction, t.status].map((label) => <th key={label} className="p-4">{label}</th>)}</tr></thead>
      <tbody>{contacts.map((contact) => <tr key={contact.id} className="border-t border-border">
        <td className="p-4"><p className="font-semibold">{contact.name || contact.instagramUsername || contact.email || contact.phone || contact.instagramId}</p>{contact.email && <p className="text-muted">{contact.email}</p>}{contact.instagramUsername && <p className="text-muted">@{contact.instagramUsername}</p>}</td>
        <td className="p-4">{Array.from(new Map(contact.interactions.filter((event) => event.automation).map((event) => [event.automation!.id, event.automation!])).values()).map((campaign) => <Link key={campaign.id} href={`/${locale}/campaigns/${campaign.id}`} className="block text-accent hover:underline">{campaign.name}</Link>)}</td>
        <td className="p-4">{contact.lastInteractionAt.toLocaleString(locale === "pt" ? "pt-BR" : locale, { timeZone: "America/Sao_Paulo" })}</td>
        <td className="p-4"><LeadStatusSelect id={contact.id} status={contact.status} locale={locale} editable={canManageWorkspace(context.role)} /></td>
      </tr>)}</tbody>
    </table></div>}
    <div className="flex justify-between">{page > 1 ? <Link href={pageUrl(page - 1)}>{t.previous}</Link> : <span />}{contacts.length === 50 && <Link href={pageUrl(page + 1)}>{t.next}</Link>}</div>
  </div>;
}
