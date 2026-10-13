"use client";

import { useParams } from "next/navigation";
import { workspaceTranslator, workspaceDateLocale } from "@/lib/i18n/workspace";

import { useEffect, useState } from "react";
import type { AccountOption } from "@/components/account-select";

interface SettingsData {
  workspace: {
    name: string;
    plan: string;
    subscriptionStatus: string;
    dmsSentThisPeriod: number;
  };
  instagramAccount: {
    id: string;
    username: string;
    instagramId: string;
    tokenExpiresAt: string | null;
    webhookSubscribed: boolean;
  } | null;
  instagramAccounts: Array<
    AccountOption & {
      tokenExpiresAt: string | null;
      webhookSubscribed: boolean;
    }
  >;
  plan: string;
  planLimits: {
    maxAutomations: number | null;
    maxDMsPerMonth: number;
    maxInstagramAccounts: number;
    maxWorkspaceMembers: number;
  };
}

interface WorkspaceMembersData {
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  members: Array<{
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: string;
    user: {
      id: string;
      email: string | null;
      name: string | null;
    };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    inviteUrl: string;
    expiresAt: string;
  }>;
}

export default function SettingsPage() {
  const { lang } = useParams<{ lang: string }>();
  const t = workspaceTranslator(lang);
  const dateLocale = workspaceDateLocale(lang);
  const [data, setData] = useState<SettingsData | null>(null);
  const [membersData, setMembersData] = useState<WorkspaceMembersData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((res) => res.json()),
      fetch("/api/workspace/members").then((res) => res.json()),
    ])
      .then(([statsPayload, membersPayload]) => {
        if (statsPayload.success) setData(statsPayload.data);
        if (membersPayload.success) setMembersData(membersPayload.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function refreshMembers() {
    const res = await fetch("/api/workspace/members");
    const payload = await res.json();
    if (payload.success) setMembersData(payload.data);
  }

  async function disconnectInstagram(instagramAccountId: string) {
    if (!confirm(t("Disconnect Instagram? Campaigns for this account will stop sending DMs."))) {
      return;
    }

    setBusy(`disconnect:${instagramAccountId}`);
    await fetch("/api/instagram/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagramAccountId }),
    });
    window.location.reload();
  }

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    setMemberError(null);
    setBusy("invite");
    const res = await fetch("/api/workspace/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const payload = await res.json();
    if (payload.success) {
      setMembersData(payload.data);
      setInviteEmail("");
    } else {
      setMemberError(payload.error ?? t("Could not invite member"));
    }
    setBusy(null);
  }

  async function removeInvitation(invitationId: string) {
    setBusy(`invite:${invitationId}`);
    await fetch("/api/workspace/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    await refreshMembers();
    setBusy(null);
  }

  async function startCheckout(plan: "PRO" | "AGENCY") {
    setBusy(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const payload = await res.json();
    if (payload.url) window.location.assign(payload.url);
    setBusy(null);
  }

  async function openBillingPortal() {
    setBusy("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const payload = await res.json();
    if (payload.url) window.location.assign(payload.url);
    setBusy(null);
  }

  if (loading) {
    return <div className="glass rounded-2xl p-8 animate-pulse h-64" />;
  }

  const accounts = data?.instagramAccounts ?? [];
  const accountLimit = data?.planLimits.maxInstagramAccounts ?? 1;
  const canManageMembers =
    membersData?.currentUserRole === "OWNER" ||
    membersData?.currentUserRole === "ADMIN";
  const memberLimit =
    data?.planLimits.maxWorkspaceMembers ?? membersData?.members.length ?? 1;
  const pendingInviteCount = membersData?.invitations.length ?? 0;
  const memberLimitReached =
    (membersData?.members.length ?? 0) + pendingInviteCount >= memberLimit;
  const accountLimitReached = accounts.length >= accountLimit;
  const usage = data
    ? `${data.workspace.dmsSentThisPeriod} / ${data.planLimits.maxDMsPerMonth}`
    : "0 / 0";

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <section className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-6">{t("Instagram Connection")}</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{t("Status")}</p>
              <p className="text-xs text-muted mt-0.5">
                {t("Comment webhooks and private replies depend on this connection.")}
              </p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                accounts.length > 0
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {accounts.length > 0 ? t("Connected") : t("Not connected")}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{t("Accounts")}</p>
              <p className="text-xs text-muted mt-0.5">
                {accounts.length} / {accountLimit} {t("connected Instagram profiles")}
              </p>
            </div>
            <span className="text-sm text-muted">
              {accounts.length > 0 ? `${accounts.length} ${t("connected")}` : t("None")}
            </span>
          </div>

          <div className="space-y-3 py-3">
            {accounts.length === 0 && (
              <p className="text-sm text-muted">
                {t("Connect an Instagram professional account to launch campaigns.")}
              </p>
            )}
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    @{account.username}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t("Token expires")}{" "}
                    {account.tokenExpiresAt
                      ? new Date(account.tokenExpiresAt).toLocaleDateString(dateLocale)
                      : t("not available")}{" "}
                    · {account.webhookSubscribed ? t("Webhook ready") : t("Webhook pending")}
                  </p>
                </div>
                <button
                  onClick={() => disconnectInstagram(account.id)}
                  disabled={busy === `disconnect:${account.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-error/20 px-4 py-2 text-sm font-medium text-error transition-all hover:border-error/40 hover:bg-error/10 disabled:opacity-50"
                >
                  {busy === `disconnect:${account.id}`
                    ? t("Disconnecting...")
                    : t("Disconnect")}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex gap-3">
          {/* API route that starts the OAuth redirect: needs a full page navigation, not <Link>. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/instagram/connect"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover"
          >
            {accounts.length > 0 ? t("Connect another account") : t("Connect Instagram")}
          </a>
          {accountLimitReached && (
            <p className="self-center text-xs text-muted">
              {t("Reconnect an existing account or upgrade to Agency for up to 10.")}
            </p>
          )}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-6">{t("Team")}</h2>
        <div className="space-y-3">
          {membersData?.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {member.user.name ?? member.user.email ?? t("Unknown member")}
                </p>
                <p className="text-xs text-muted">{member.user.email}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                {t(member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Member")}
              </span>
            </div>
          ))}
        </div>

        {membersData?.invitations.length ? (
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("Pending invites")}
            </p>
            <div className="space-y-3">
              {membersData.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {invitation.email}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {t(invitation.role === "ADMIN" ? "Admin" : "Member")} · {invitation.inviteUrl}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard?.writeText(invitation.inviteUrl)
                      }
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
                    >
                      {t("Copy")}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeInvitation(invitation.id)}
                      disabled={busy === `invite:${invitation.id}`}
                      className="rounded-lg border border-error/20 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                    >
                      {t("Revoke")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {canManageMembers && memberLimitReached && (
          <p className="mt-6 border-t border-border pt-4 text-sm text-muted">
            {lang === "en" ? `This plan allows ${memberLimit} workspace members. Upgrade to Agency to invite a team.` : lang === "es" ? `Este plan permite ${memberLimit} miembros. Cambia a Agency para invitar a un equipo.` : `Este plano permite ${memberLimit} membros. Mude para Agency para convidar uma equipe.`}
          </p>
        )}

        {canManageMembers && !memberLimitReached && (
          <form
            onSubmit={inviteMember}
            className="mt-6 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_140px_auto]"
          >
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="teammate@agency.com"
              className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent/40"
              required
            />
            <select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as "ADMIN" | "MEMBER")
              }
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent/40"
            >
              <option value="MEMBER">{t("Member")}</option>
              <option value="ADMIN">{t("Admin")}</option>
            </select>
            <button
              type="submit"
              disabled={busy === "invite"}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "invite" ? t("Inviting...") : t("Invite")}
            </button>
            {memberError && (
              <p className="sm:col-span-3 text-sm text-error">{memberError}</p>
            )}
          </form>
        )}
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-6">{t("Billing")}</h2>

        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-accent/15">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {data?.plan ?? "FREE"} {t("Plan")}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {usage} {t("DMs used this month")}
              </p>
            </div>
            <button
              onClick={openBillingPortal}
              disabled={busy === "portal"}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-foreground hover:border-border-hover transition-colors disabled:opacity-50"
            >
              {t("Billing Portal")}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[
            { plan: "PRO" as const, price: t("$19/mo"), features: t("10 campaigns · 2,000 DMs/month") },
            { plan: "AGENCY" as const, price: t("$49/mo"), features: t("Unlimited campaigns · 10 accounts · 10,000 DMs/month") },
          ].map((tier) => (
            <div
              key={tier.plan}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{tier.plan}</p>
                <p className="text-xs text-muted">{tier.features}</p>
              </div>
              <button
                onClick={() => startCheckout(tier.plan)}
                disabled={busy === tier.plan}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {busy === tier.plan ? t("Opening...") : tier.price}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
