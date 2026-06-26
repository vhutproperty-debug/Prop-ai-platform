/**
 * Safe diagnostic for FIRECRAWL_API_KEY loading — never prints secret values.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

const cwd = process.cwd();
const localPath = resolve(cwd, ".env.local");
const envPath = resolve(cwd, ".env");

function valueLengthFromLine(line) {
  if (!line || !line.includes("=")) return 0;
  let value = line.slice(line.indexOf("=") + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.length;
}

const diag = {
  cwd,
  files: {
    envLocalExists: existsSync(localPath),
    envLocalPath: localPath,
    envExists: existsSync(envPath),
  },
  beforeLoad: {
    FIRECRAWL_API_KEY_defined: process.env.FIRECRAWL_API_KEY !== undefined,
    FIRECRAWL_API_KEY_nonempty: Boolean(process.env.FIRECRAWL_API_KEY?.length),
    MONGODB_URI_defined: process.env.MONGODB_URI !== undefined,
  },
};

if (existsSync(localPath)) {
  const raw = readFileSync(localPath, "utf8");
  const lines = raw.split(/\r?\n/);
  const firecrawlLine = lines.find(
    (line) => /^\s*FIRECRAWL/i.test(line) && !line.trim().startsWith("#")
  );
  diag.envLocal = {
    lineCount: lines.length,
    hasUtf8Bom: raw.charCodeAt(0) === 0xfeff,
    firecrawlLineFound: Boolean(firecrawlLine),
    firecrawlKeyExact: firecrawlLine?.split("=")[0]?.trim() === "FIRECRAWL_API_KEY",
    firecrawlValueLength: valueLengthFromLine(firecrawlLine),
    firecrawlValueEmpty: valueLengthFromLine(firecrawlLine) === 0,
  };
}

loadEnvFiles();

diag.afterLoadEnvFiles = {
  FIRECRAWL_API_KEY_defined: process.env.FIRECRAWL_API_KEY !== undefined,
  FIRECRAWL_API_KEY_nonempty: Boolean(process.env.FIRECRAWL_API_KEY?.length),
  loadEnvFilesWouldSkipDueToPreexistingEmpty:
    diag.beforeLoad.FIRECRAWL_API_KEY_defined &&
    !diag.beforeLoad.FIRECRAWL_API_KEY_nonempty &&
    !diag.afterLoadEnvFiles.FIRECRAWL_API_KEY_nonempty,
};

const { isFirecrawlConfigured, env } = await import("../config/env.ts");

diag.afterConfigEnvImport = {
  isFirecrawlConfigured,
  envKeyNonempty: Boolean(env.FIRECRAWL_API_KEY?.length),
  loadEnvIfNeededSkippedBecauseMongoUri:
    Boolean(process.env.MONGODB_URI) && !diag.beforeLoad.MONGODB_URI_defined,
};

console.log(JSON.stringify(diag, null, 2));
