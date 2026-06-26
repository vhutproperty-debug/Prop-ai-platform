/**
 * Atlas provisioning — loads .atlas-setup.env, never logs secrets.
 */
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";

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
const outputFile = resolve(process.cwd(), process.env.ATLAS_OUTPUT_FILE ?? ".atlas-output.json");
const dbUser = process.env.ATLAS_DB_USER ?? "propai_dev";
const dbPassword = process.env.ATLAS_DB_PASSWORD ?? password;
const dbName = process.env.ATLAS_DB_NAME ?? "propai";

if (!email || !password) {
  console.error("[Atlas] ATLAS_EMAIL and ATLAS_PASSWORD are required.");
  process.exit(1);
}

function encodePassword(pwd) {
  return encodeURIComponent(pwd);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fillFirst(page, selectors, value) {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.count()) {
      await el.click();
      await el.fill("");
      await el.type(value, { delay: 40 });
      return true;
    }
  }
  return false;
}

async function clickFirst(page, selectors) {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.count()) {
      await el.click();
      return true;
    }
  }
  return false;
}

async function login(page, allowManual = true) {
  await page.goto("https://account.mongodb.com/account/login", {
    waitUntil: "networkidle",
    timeout: 120_000,
  });

  const emailOk = await fillFirst(page, [
    'input[name="username"]',
    'input[type="email"]',
    'input[id*="email" i]',
    'input[autocomplete="username"]',
  ], email);

  if (!emailOk) throw new Error("Email field not found on Atlas login page.");

  await clickFirst(page, ['button:has-text("Next")', 'button[type="submit"]']);
  await sleep(2000);

  const passwordOk = await fillFirst(page, [
    'input[name="password"]',
    'input[type="password"]',
    'input[autocomplete="current-password"]',
  ], password);

  if (passwordOk) {
    await clickFirst(page, [
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'button[type="submit"]',
    ]);
    await sleep(3000);
  }

  if (page.url().includes("/login") && allowManual) {
    console.log("[Atlas] Auto-login incomplete — waiting up to 5 minutes for manual login in browser...");
    try {
      await page.waitForURL(/cloud\.mongodb\.com/, { timeout: 300_000 });
    } catch {
      throw new Error("Login not completed within 5 minutes.");
    }
  } else if (page.url().includes("/login")) {
    throw new Error("Login failed — still on login page.");
  }

  console.log("[Atlas] Login successful.");
}

async function ensureNetworkAccess(page) {
  await page.goto("https://cloud.mongodb.com/v2#/security/network/accessList", {
    waitUntil: "domcontentloaded",
  });
  await sleep(4000);

  const body = await page.content();
  if (body.includes("0.0.0.0/0") || body.includes("Allow Access from Anywhere")) {
    console.log("[Atlas] Network access already allows all IPs.");
    return;
  }

  await clickFirst(page, [
    'button:has-text("Add IP Address")',
    'button:has-text("ADD IP ADDRESS")',
    'button:has-text("Add Entry")',
  ]);
  await sleep(1500);

  await clickFirst(page, [
    'button:has-text("Allow Access from Anywhere")',
    'span:has-text("Allow Access from Anywhere")',
  ]);
  await sleep(500);

  await clickFirst(page, [
    'button:has-text("Confirm")',
    'button:has-text("Add Entry")',
    'button:has-text("Save")',
  ]);
  await sleep(2000);
  console.log("[Atlas] Network access configured.");
}

async function ensureDbUser(page) {
  await page.goto("https://cloud.mongodb.com/v2#/security/database/users", {
    waitUntil: "domcontentloaded",
  });
  await sleep(4000);

  const body = await page.content();
  if (body.includes(dbUser)) {
    console.log("[Atlas] Database user already exists.");
    return;
  }

  await clickFirst(page, [
    'button:has-text("Add New Database User")',
    'button:has-text("ADD NEW DATABASE USER")',
    'button:has-text("Add User")',
  ]);
  await sleep(1500);

  await fillFirst(page, ['input[name="username"]', 'input[placeholder*="username" i]'], dbUser);
  await fillFirst(page, ['input[name="password"]', 'input[type="password"]'], dbPassword);

  await clickFirst(page, [
    'button:has-text("Add User")',
    'button:has-text("Create User")',
  ]);
  await sleep(3000);
  console.log("[Atlas] Database user created.");
}

async function getConnectionUri(page) {
  await page.goto("https://cloud.mongodb.com/v2#/clusters", {
    waitUntil: "domcontentloaded",
  });
  await sleep(5000);

  // Wait for cluster to be ready
  const connectVisible = page.locator('button:has-text("Connect")').first();
  if (!(await connectVisible.count())) {
    console.log("[Atlas] No Connect button — waiting for cluster...");
    await page.waitForSelector('button:has-text("Connect")', { timeout: 600_000 });
  }

  await connectVisible.click();
  await sleep(2000);

  await clickFirst(page, [
    'button:has-text("Drivers")',
    'div:has-text("Drivers")',
  ]);
  await sleep(2000);

  const body = await page.content();
  const match = body.match(/mongodb\+srv:\/\/[^"'<>\s]+/);
  if (!match) throw new Error("Could not find mongodb+srv URI in Connect dialog.");

  let uri = match[0]
    .replace("<username>", dbUser)
    .replace("<password>", encodePassword(dbPassword));

  if (uri.includes("<username>") || uri.includes("<password>")) {
    const hostPart = uri.split("@")[1] ?? "";
    uri = `mongodb+srv://${encodePassword(dbUser)}:${encodePassword(dbPassword)}@${hostPart}`;
  }

  if (!uri.includes(`/${dbName}`)) {
    if (uri.includes("?")) {
      uri = uri.replace("?", `/${dbName}?`);
    } else {
      uri = `${uri}/${dbName}?retryWrites=true&w=majority`;
    }
  }

  return uri;
}

async function main() {
  chromium.use(StealthPlugin());
  console.log("[Atlas] Launching Chrome...");
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await chromium.launch({
    headless: false,
    executablePath: chromePath,
    args: ["--disable-blink-features=AutomationControlled"],
    slowMo: 50,
  });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    await login(page);
    await ensureNetworkAccess(page);
    await ensureDbUser(page);
    const uri = await getConnectionUri(page);
    const hostMatch = uri.match(/@([^/?]+)/);

    writeFileSync(
      outputFile,
      JSON.stringify(
        {
          clusterHost: hostMatch?.[1] ?? null,
          databaseName: dbName,
          dbUser,
          uri,
          provisionedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log("[Atlas] Setup complete.");
  } catch (error) {
    try {
      await page.screenshot({ path: resolve(process.cwd(), ".atlas-debug.png"), fullPage: true });
    } catch {
      // browser may already be closed
    }
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[Atlas] Setup failed:", err.message);
  process.exit(1);
});
