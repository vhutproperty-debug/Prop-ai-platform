/**
 * Attempt Atlas session login via HTTP, then provision via public API.
 * Never logs credentials or tokens.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";

const setupEnvPath = resolve(process.cwd(), ".atlas-setup.env");
if (existsSync(setupEnvPath)) {
  for (const line of readFileSync(setupEnvPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const email = process.env.ATLAS_EMAIL;
const password = process.env.ATLAS_PASSWORD;
const dbUser = process.env.ATLAS_DB_USER ?? "propai_dev";
const dbPassword = process.env.ATLAS_DB_PASSWORD ?? password;
const dbName = process.env.ATLAS_DB_NAME ?? "propai";
const outputFile = resolve(process.cwd(), ".atlas-output.json");

function encodePassword(pwd) {
  return encodeURIComponent(pwd);
}

async function tryLogin() {
  const endpoints = [
    {
      url: "https://cloud.mongodb.com/user/v1/login",
      body: { username: email, password },
    },
    {
      url: "https://account.mongodb.com/account/login",
      body: { username: email, password, login: "true" },
    },
  ];

  for (const { url, body } of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        redirect: "manual",
      });
      const setCookie = res.headers.getSetCookie?.() ?? [];
      const text = await res.text();
      if (res.ok || setCookie.length > 0) {
        return { status: res.status, cookies: setCookie, body: text.slice(0, 200) };
      }
    } catch {
      // try next
    }
  }
  return null;
}

async function main() {
  if (!email || !password) {
    console.error("[Atlas-API] Missing credentials.");
    process.exit(1);
  }

  console.log("[Atlas-API] Attempting programmatic login...");
  const login = await tryLogin();
  if (!login) {
    console.error("[Atlas-API] HTTP login not available — Atlas requires browser auth or a connection string.");
    process.exit(1);
  }

  console.log("[Atlas-API] Login response status:", login.status);
  console.log("[Atlas-API] Cookie count:", login.cookies.length);
  process.exit(login.cookies.length > 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("[Atlas-API] Error:", e.message);
  process.exit(1);
});
