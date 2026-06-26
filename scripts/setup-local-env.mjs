/**
 * Creates .env.local from Atlas output + generated JWT secret.
 * Never prints secrets.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { randomBytes } from "crypto";
import { resolve } from "path";

const atlasOutput = resolve(process.cwd(), ".atlas-output.json");
const envLocal = resolve(process.cwd(), ".env.local");
const example = resolve(process.cwd(), ".env.example");

if (!existsSync(atlasOutput)) {
  console.error("[Setup] Missing .atlas-output.json — run atlas-provision first.");
  process.exit(1);
}

const atlas = JSON.parse(readFileSync(atlasOutput, "utf8"));
const jwtSecret = randomBytes(48).toString("base64url");

let template = existsSync(example) ? readFileSync(example, "utf8") : "";

const lines = template.split(/\r?\n/).filter((line) => {
  const key = line.split("=")[0]?.trim();
  return !["MONGODB_URI", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"].includes(key);
});

const envContent = [
  "# Auto-generated for local development — do not commit",
  `MONGODB_URI=${atlas.uri}`,
  `JWT_SECRET=${jwtSecret}`,
  "NEXT_PUBLIC_APP_URL=http://localhost:3000",
  "",
  ...lines.filter((l) => l.trim() && !l.startsWith("# MongoDB")),
].join("\n");

writeFileSync(envLocal, envContent, "utf8");
console.log("[Setup] .env.local created successfully.");

try {
  unlinkSync(atlasOutput);
  console.log("[Setup] Temporary Atlas output removed.");
} catch {
  // ignore
}
