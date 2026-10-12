"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface InvitationAcceptCardProps {
  token: string;
  isSignedIn: boolean;
  invitedEmail: string;
}

export default function InvitationAcceptCard({
  token,
  isSignedIn,
  invitedEmail,
}: InvitationAcceptCardProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = ["pt", "en", "es"].includes(segments[0]) ? segments[0] : "pt";
  const prefix = `/${currentLocale}`;

  async function acceptInvite() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/workspace/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const payload = await response.json();
    if (payload.success) {
      window.location.assign(`${prefix}/dashboard`);
      return;
    }
    setMessage(payload.error ?? "Could not accept invitation");
    setBusy(false);
  }

  if (!isSignedIn) {
    return (
      <Link
        href={`${prefix}/login`}
        className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
      >
        Sign in to accept
      </Link>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={acceptInvite}
        disabled={busy}
        className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "Accepting..." : "Accept invitation"}
      </button>
      {message && <p className="text-sm text-error">{message}</p>}
      <p className="text-xs text-muted">
        Use the magic link account for {invitedEmail}.
      </p>
    </div>
  );
}
