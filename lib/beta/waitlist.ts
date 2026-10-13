import { z } from "zod";

export const betaWaitlistSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  goal: z.string().trim().max(500).optional().or(z.literal("")),
  source: z.enum(["landing-page", "referral", "agency-outreach", "other"]).default("landing-page"),
});

export type BetaWaitlistEntry = z.infer<typeof betaWaitlistSchema>;

export function normalizeBetaWaitlistEntry(input: Partial<BetaWaitlistEntry>) {
  const data = betaWaitlistSchema.parse({
    name: input.name ?? "",
    email: input.email ?? "",
    company: input.company ?? "",
    goal: input.goal ?? "",
    source: input.source ?? "landing-page",
  });

  return {
    ...data,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    company: data.company?.trim() || "",
    goal: data.goal?.trim() || "",
  };
}

export function dedupeWaitlistEntries(entries: BetaWaitlistEntry[]) {
  const seen = new Map<string, BetaWaitlistEntry>();

  for (const entry of entries) {
    const key = entry.email.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, entry);
    }
  }

  return Array.from(seen.values());
}
