import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeBetaWaitlistEntry } from "../lib/beta/waitlist";
import { saveBetaWaitlistEntry } from "../lib/beta/storage";
import { prisma } from "../lib/db/client";
async function main() {
  const file = process.argv[2] ?? join(process.cwd(), ".data", "beta-waitlist.jsonl");
  let contents: string;
  try { contents = await readFile(file, "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") { console.log("Nenhuma lista legada encontrada."); return; }
    throw error;
  }
  const entries = contents.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return normalizeBetaWaitlistEntry(JSON.parse(line)); }
    catch { throw new Error(`Registro inválido na linha ${index + 1}; corrija antes de importar.`); }
  });
  let imported = 0;
  for (const entry of entries) if ((await saveBetaWaitlistEntry(entry)).isNew) imported++;
  console.log(`${imported} novos cadastros importados. O arquivo original foi preservado.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
