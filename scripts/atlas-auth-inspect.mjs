/**
 * Inspect Atlas auth request shape (never logs password values).
 */
import { chromium } from "playwright-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

chromium.use(Stealth());

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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("request", (req) => {
    if (req.url().includes("/account/auth") && req.method() === "POST") {
      const data = req.postData() ?? "";
      const redacted = data.replace(/("password"\s*:\s*")[^"]+(")/g, '$1***$2');
      console.log("[Auth POST]", req.headers()["content-type"]);
      console.log("[Auth body redacted]", redacted.slice(0, 500));
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/account/auth")) {
      const text = await res.text().catch(() => "");
      console.log("[Auth response]", res.status(), text.slice(0, 300));
    }
  });

  await page.goto("https://account.mongodb.com/account/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="username"]').first().fill(email);
  await page.locator('button:has-text("Next")').click();
  await sleep(2000);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button:has-text("Log in"), button:has-text("Login")').click();
  await sleep(5000);
  await browser.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
