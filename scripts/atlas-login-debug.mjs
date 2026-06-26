/**
 * Diagnose Atlas login API responses (no credential logging).
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

  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes("mongodb.com")) return;
    if (url.includes("login") || url.includes("auth") || url.includes("token")) {
      console.log("[Network]", res.status(), url.split("?")[0]);
    }
  });

  await page.goto("https://account.mongodb.com/account/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"], input[name="username"]').first().fill(email);
  await page.locator('button:has-text("Next")').click();
  await sleep(2000);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button:has-text("Log in"), button:has-text("Login")').click();
  await sleep(5000);

  const alert = await page.locator('[role="alert"]').first().textContent().catch(() => null);
  if (alert) console.log("[Alert]", alert);
  console.log("[URL]", page.url());

  await browser.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
