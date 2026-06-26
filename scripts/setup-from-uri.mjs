/**
 * Create .env.local from .mongo-uri.local (single line, gitignored).
 * Validates connection, runs seed. Never prints the URI.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";
import { spawnSync } from "child_process";
import mongoose from "mongoose";

const uriFile = resolve(process.cwd(), ".mongo-uri.local");
const envLocal = resolve(process.cwd(), ".env.local");
const example = resolve(process.cwd(), ".env.example");

if (!existsSync(uriFile)) {
  console.error("[Setup] Create .mongo-uri.local with your Atlas connection string on line 1.");
  process.exit(1);
}

const uri = readFileSync(uriFile, "utf8").trim().split(/\r?\n/)[0]?.trim();
if (!uri?.startsWith("mongodb")) {
  console.error("[Setup] .mongo-uri.local must contain a valid mongodb:// or mongodb+srv:// URI.");
  process.exit(1);
}

const jwtSecret = randomBytes(32).toString("hex");
const template = existsSync(example) ? readFileSync(example, "utf8") : "";

const envContent = [
  "# Auto-generated — do not commit",
  `MONGODB_URI=${uri}`,
  `JWT_SECRET=${jwtSecret}`,
  "NEXT_PUBLIC_APP_URL=http://localhost:3000",
  "",
  ...template.split(/\r?\n/).filter((l) => {
    const k = l.split("=")[0]?.trim();
    return l.trim() && !l.startsWith("# MongoDB") && !["MONGODB_URI", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"].includes(k);
  }),
].join("\n");

writeFileSync(envLocal, envContent, "utf8");
console.log("[Setup] .env.local created.");

console.log("[Setup] Testing connection...");
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  console.log("[Setup] Connected to database:", mongoose.connection.name);
  await mongoose.disconnect();
} catch (e) {
  console.error("[Setup] Connection failed:", e instanceof Error ? e.message : e);
  process.exit(1);
}

console.log("[Setup] Running seed...");
const seed = spawnSync("npm", ["run", "seed"], { stdio: "inherit", shell: true });
process.exit(seed.status ?? 1);
