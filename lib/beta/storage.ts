import { mkdir, appendFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export function resolveBetaWaitlistFilePath() {
  return join(process.cwd(), ".data", "beta-waitlist.jsonl");
}

export async function saveBetaWaitlistEntry(entry: {
  name: string;
  email: string;
  company?: string;
  goal?: string;
  source: string;
}) {
  const filePath = resolveBetaWaitlistFilePath();

  await mkdir(dirname(filePath), { recursive: true });
  const payload = JSON.stringify({
    ...entry,
    createdAt: new Date().toISOString(),
  });

  await appendFile(filePath, `${payload}\n`, "utf8");
  return filePath;
}

export async function readBetaWaitlistEntries() {
  const filePath = resolveBetaWaitlistFilePath();

  try {
    const content = await readFile(filePath, "utf8");
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => JSON.parse(line) as {
      name: string;
      email: string;
      company?: string;
      goal?: string;
      source: string;
      createdAt?: string;
    });
  } catch (error) {
    const maybeError = error as NodeJS.ErrnoException;
    if (maybeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
