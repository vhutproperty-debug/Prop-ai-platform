/**
 * Combined Atlas CLI device-code + browser login (handles CAPTCHA manually).
 */
import { spawn } from "child_process";
import { chromium } from "playwright-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";
import { execFileSync } from "child_process";

chromium.use(Stealth());

const ATLAS = resolve(process.cwd(), ".atlas-cli/bin/atlas.exe");
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

function isAuthed() {
  try {
    execFileSync(ATLAS, ["auth", "whoami"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function startDeviceCodeLogin() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(ATLAS, ["auth", "login", "--noBrowser"], { stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    child.stdout.on("data", (d) => {
      buf += d.toString();
      const match = buf.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/);
      if (match) resolvePromise({ child, code: match[1] });
    });
    child.stderr.on("data", (d) => { buf += d.toString(); });
    child.on("error", reject);
    setTimeout(() => reject(new Error("Timed out waiting for device code")), 30_000);
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function browserActivateCode(code) {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await chromium.launch({
    headless: false,
    executablePath: chromePath,
    slowMo: 40,
  });
  const page = await browser.newPage();

  console.log("[Auth] Opened browser — complete login if prompted, then activating CLI...");
  await page.goto("https://account.mongodb.com/account/connect", { waitUntil: "domcontentloaded" });

  // If login required
  if (page.url().includes("login")) {
    await page.locator('input[type="email"], input[name="username"]').first().fill(email);
    await page.locator('button:has-text("Next")').click().catch(() => {});
    await sleep(1500);
    const pwd = page.locator('input[type="password"]').first();
    if (await pwd.count()) await pwd.fill(password);
    await page.locator('button:has-text("Log in"), button:has-text("Login")').click().catch(() => {});
    console.log("[Auth] If CAPTCHA appears, complete it in the browser window...");
    await page.waitForURL(/connect|cloud\.mongodb\.com/, { timeout: 300_000 }).catch(() => {});
  }

  await page.goto("https://account.mongodb.com/account/connect", { waitUntil: "domcontentloaded" });
  await sleep(2000);

  const codeInput = page.locator('input[type="text"], input[name="code"], input[placeholder*="code" i]').first();
  if (await codeInput.count()) {
    await codeInput.fill(code);
    await page.locator('button:has-text("Confirm"), button:has-text("Activate"), button[type="submit"]').first().click();
  } else {
    console.log("[Auth] Enter this code manually in the browser:", code);
    console.log("[Auth] Waiting 5 minutes...");
    await sleep(300_000);
  }

  await sleep(5000);
  await browser.close();
}

async function main() {
  if (isAuthed()) {
    console.log("[Auth] Already authenticated.");
    return;
  }

  console.log("[Auth] Requesting Atlas CLI device code...");
  const { child, code } = await startDeviceCodeLogin();
  console.log("[Auth] Device code generated (expires in 3 minutes).");

  await browserActivateCode(code);

  for (let i = 0; i < 60; i++) {
    if (isAuthed()) {
      console.log("[Auth] Atlas CLI authenticated.");
      child.kill();
      return;
    }
    await sleep(3000);
  }

  child.kill();
  throw new Error("Atlas CLI authentication did not complete.");
}

main().catch((e) => {
  console.error("[Auth]", e.message);
  process.exit(1);
});
