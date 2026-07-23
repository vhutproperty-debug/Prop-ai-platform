/**
 * Sync required vars from .env.local to Vercel (never prints secret values).
 * Usage: node --require ./scripts/setup-dns.cjs ./node_modules/tsx/dist/cli.mjs scripts/sync-vercel-env.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const PRODUCTION_APP_URL = "https://propai-zeta.vercel.app";

const KEYS = [
  "MONGODB_URI",
  "JWT_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "FIRECRAWL_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "OPENAI_API_KEY",
  "CRM_WEBHOOK_URL",
];

const ENV_TARGETS = ["production", "preview", "development"];

function parseEnvFile(filePath) {
  const vars = {};
  if (!existsSync(filePath)) return vars;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) vars[key] = value;
  }
  return vars;
}

function addVercelEnv(key, value, target) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", key, target, "--force"],
    {
      input: value,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd: process.cwd(),
    }
  );

  if (result.status !== 0) {
    throw new Error(
      `Failed to set ${key} (${target}): ${result.stderr || result.stdout}`
    );
  }
}

const localPath = resolve(process.cwd(), ".env.local");
if (!existsSync(localPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const local = parseEnvFile(localPath);
const report = { synced: [], skipped: [], errors: [] };

for (const target of ENV_TARGETS) {
  for (const key of KEYS) {
    let value = local[key];
    if (!value) {
      report.skipped.push(`${key}:${target} (missing locally)`);
      continue;
    }

    if (key === "NEXT_PUBLIC_APP_URL" && target === "production") {
      value = PRODUCTION_APP_URL;
    }

    if (
      key.startsWith("CLOUDINARY_") &&
      (value.includes("your-") || value === "")
    ) {
      report.skipped.push(`${key}:${target} (placeholder)`);
      continue;
    }

    try {
      addVercelEnv(key, value, target);
      report.synced.push(`${key}:${target}`);
    } catch (error) {
      report.errors.push(
        `${key}:${target} — ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

console.log(JSON.stringify(report, null, 2));

if (!local.MONGODB_URI || !local.JWT_SECRET) {
  console.error("MONGODB_URI and JWT_SECRET must be set in .env.local");
  process.exit(1);
}

if (report.errors.length) {
  process.exit(1);
}

console.log("\nVercel env sync complete. Redeploy with: npx vercel --prod --yes");
