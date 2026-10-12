import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/client";

export async function saveBetaWaitlistEntry(entry: {
  name: string;
  email: string;
  company?: string;
  goal?: string;
  source: string;
}) {
  const email = entry.email.trim().toLowerCase();
  // Repeated submissions keep one durable record and preserve original attribution.
  const id = randomUUID();
  const stored = await prisma.betaWaitlistEntry.upsert({
    where: { email }, create: { ...entry, email, id }, update: { email },
  });
  return { ...stored, isNew: stored.id === id };
}

export async function readBetaWaitlistEntries() {
  return prisma.betaWaitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
}
