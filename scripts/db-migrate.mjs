#!/usr/bin/env node
// Applies Prisma migrations to a remote environment (HM or PD).
//
//   npm run db:migrate:hm   -> reads .env.hm
//   npm run db:migrate:pd   -> reads .env.pd (asks for confirmation)
//
// The env file only needs DIRECT_URL (Supabase Session pooler, port 5432).
// Both DATABASE_URL and DIRECT_URL are forced to that value so the local
// .env (loaded by prisma.config.ts) can never redirect the migration.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createInterface } from "node:readline/promises";

const target = process.argv[2];
if (!["hm", "pd"].includes(target)) {
  console.error("Usage: node scripts/db-migrate.mjs <hm|pd>");
  process.exit(1);
}

const envFile = `.env.${target}`;
if (!existsSync(envFile)) {
  console.error(`${envFile} not found. Create it with DIRECT_URL=... (see docs/environments.md).`);
  process.exit(1);
}

const { DIRECT_URL: directUrl } = parseEnv(readFileSync(envFile, "utf8"));
if (!directUrl) {
  console.error(`DIRECT_URL is missing in ${envFile}.`);
  process.exit(1);
}

const { hostname, username } = new URL(directUrl);
console.log(`Target: ${target.toUpperCase()} -> ${username}@${hostname}`);

if (target === "pd") {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Type "pd" to apply migrations to PRODUCTION: ');
  rl.close();
  if (answer.trim() !== "pd") {
    console.log("Aborted.");
    process.exit(1);
  }
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: directUrl, DIRECT_URL: directUrl },
});
process.exit(result.status ?? 1);
