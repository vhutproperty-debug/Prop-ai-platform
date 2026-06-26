import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";

const uri = readFileSync(resolve(process.cwd(), ".mongo-uri.local"), "utf8").trim().split(/\r?\n/)[0].trim();
const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
const jwt = randomBytes(32).toString("hex");

const lines = example.split(/\r?\n/).filter((l) => {
  const trimmed = l.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  const eq = trimmed.indexOf("=");
  if (eq === -1) return false;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (!value) return false;
  return !["MONGODB_URI", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"].includes(key);
});

writeFileSync(
  resolve(process.cwd(), ".env.local"),
  [
    "# Local development — do not commit",
    `MONGODB_URI=${uri}`,
    `JWT_SECRET=${jwt}`,
    "NEXT_PUBLIC_APP_URL=http://localhost:3000",
    "",
    ...lines,
  ].join("\n"),
  "utf8"
);

console.log("[Env] .env.local created with required variables.");
