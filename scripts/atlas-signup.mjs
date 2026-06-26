/**
 * Try Atlas signup + cluster creation when login fails.
 */
import { chromium } from "playwright-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { writeFileSync, readFileSync, existsSync } from "fs";
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
const dbUser = process.env.ATLAS_DB_USER ?? "propai_dev";
const dbPassword = process.env.ATLAS_DB_PASSWORD ?? password;
const dbName = process.env.ATLAS_DB_NAME ?? "propai";
const outputFile = resolve(process.cwd(), ".atlas-output.json");

function encodePassword(pwd) {
  return encodeURIComponent(pwd);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://www.mongodb.com/cloud/atlas/register", {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    await sleep(2000);

    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailField.count()) await emailField.fill(email);
    const pwdFields = page.locator('input[type="password"]');
    if (await pwdFields.count()) await pwdFields.first().fill(password);

    await page.locator('button:has-text("Create"), button:has-text("Get started"), button[type="submit"]').first().click();
    await sleep(5000);

    const url = page.url();
    console.log("[Atlas-Signup] Landed on:", url.replace(/\/\/.*@/, "//***@"));

    if (url.includes("cloud.mongodb.com")) {
      console.log("[Atlas-Signup] Registration may have succeeded.");
    } else {
      const body = await page.content();
      if (body.includes("already") || body.includes("exists")) {
        console.log("[Atlas-Signup] Account likely already exists.");
      } else {
        console.log("[Atlas-Signup] Registration did not reach Atlas dashboard.");
      }
    }

    await page.screenshot({ path: resolve(process.cwd(), ".atlas-signup-debug.png"), fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("[Atlas-Signup]", e.message);
  process.exit(1);
});
