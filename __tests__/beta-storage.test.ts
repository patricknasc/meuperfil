import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  saveBetaWaitlistEntry,
  readBetaWaitlistEntries,
  resolveBetaWaitlistFilePath,
} from "../lib/beta/storage";

describe("beta storage", () => {
  const originalCwd = process.cwd();

  afterEach(async () => {
    process.chdir(originalCwd);
  });

  it("persists entries to the project data folder and reads them back", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "meuperfil-beta-"));
    process.chdir(tempDir);

    const entry = {
      name: "Ana Silva",
      email: "ana@studio.com",
      company: "Studio North",
      goal: "Launch waitlist",
      source: "landing-page",
    } as const;

    const filePath = await saveBetaWaitlistEntry(entry);
    const stored = await readBetaWaitlistEntries();

    expect(filePath).toBe(resolveBetaWaitlistFilePath());
    expect(stored).toHaveLength(1);
    expect(stored[0].email).toBe("ana@studio.com");
    expect(stored[0]).toMatchObject({
      name: "Ana Silva",
      company: "Studio North",
      goal: "Launch waitlist",
      source: "landing-page",
    });

    await rm(tempDir, { recursive: true, force: true });
  });
});
