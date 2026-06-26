/**
 * Atlas CLI device-code auth + cluster provisioning.
 * Never prints secrets. Requires human to complete device code once at:
 * https://account.mongodb.com/account/connect
 */
import { spawn, execFileSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";

const ATLAS = resolve(process.cwd(), ".atlas-cli/bin/atlas.exe");
const setupEnvPath = resolve(process.cwd(), ".atlas-setup.env");
const outputFile = resolve(process.cwd(), ".atlas-output.json");
const envLocal = resolve(process.cwd(), ".env.local");

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

const dbUser = process.env.ATLAS_DB_USER ?? "propai_dev";
const dbPassword = process.env.ATLAS_DB_PASSWORD ?? randomBytes(24).toString("base64url");
const dbName = process.env.ATLAS_DB_NAME ?? "propai";
const clusterName = process.env.ATLAS_CLUSTER_NAME ?? "PropAICluster";

function runAtlas(args, opts = {}) {
  return execFileSync(ATLAS, args, {
    encoding: "utf8",
    stdio: opts.silent ? "pipe" : "inherit",
    ...opts,
  });
}

function runAtlasJson(args) {
  const out = execFileSync(ATLAS, [...args, "-o", "json"], { encoding: "utf8" });
  return JSON.parse(out);
}

function isAuthed() {
  try {
    runAtlas(["auth", "whoami"], { silent: true });
    return true;
  } catch {
    return false;
  }
}

async function waitForAuth(maxMs = 600_000) {
  if (isAuthed()) {
    console.log("[Atlas-CLI] Already authenticated.");
    return;
  }

  console.log("[Atlas-CLI] Starting device-code login...");
  console.log("[Atlas-CLI] Open https://account.mongodb.com/account/connect and enter the code shown below.");
  console.log("[Atlas-CLI] Waiting up to 10 minutes for authorization...");

  const child = spawn(ATLAS, ["auth", "login", "--noBrowser"], { stdio: "inherit" });
  await new Promise((resolvePromise) => child.on("close", resolvePromise));

  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (isAuthed()) {
      console.log("[Atlas-CLI] Authentication successful.");
      return;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Atlas CLI authentication timed out.");
}

function encodePassword(pwd) {
  return encodeURIComponent(pwd);
}

async function main() {
  await waitForAuth();

  const projects = runAtlasJson(["projects", "list"]);
  let projectId = projects.results?.[0]?.id;
  if (!projectId) {
    const created = runAtlasJson(["projects", "create", "PropAI", "--orgId", projects.results?.[0]?.orgId ?? ""]);
    projectId = created.id;
  }
  if (!projectId) throw new Error("No Atlas project available.");

  console.log("[Atlas-CLI] Using project:", projectId);

  let clusters;
  try {
    clusters = runAtlasJson(["clusters", "list", "--projectId", projectId]);
  } catch {
    clusters = { results: [] };
  }

  if (!clusters.results?.length) {
    console.log("[Atlas-CLI] Creating M0 cluster (may take several minutes)...");
    runAtlas([
      "clusters", "create", clusterName,
      "--projectId", projectId,
      "--provider", "AWS",
      "--region", "AP_SOUTH_1",
      "--tier", "M0",
    ]);
    console.log("[Atlas-CLI] Waiting for cluster to become available...");
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 15_000));
      clusters = runAtlasJson(["clusters", "list", "--projectId", projectId]);
      const state = clusters.results?.[0]?.stateName;
      console.log("[Atlas-CLI] Cluster state:", state ?? "unknown");
      if (state === "IDLE") break;
    }
  }

  const cluster = clusters.results?.[0];
  if (!cluster) throw new Error("Cluster not found after create.");

  try {
    runAtlas([
      "accessLists", "create",
      "--projectId", projectId,
      "--cidr", "0.0.0.0/0",
      "--comment", "PropAI local dev",
    ], { silent: true });
    console.log("[Atlas-CLI] Network access configured.");
  } catch {
    console.log("[Atlas-CLI] Network access entry may already exist.");
  }

  try {
    runAtlas([
      "dbusers", "create",
      "--projectId", projectId,
      "--username", dbUser,
      "--password", dbPassword,
      "--role", "atlasAdmin",
    ], { silent: true });
    console.log("[Atlas-CLI] Database user created.");
  } catch {
    console.log("[Atlas-CLI] Database user may already exist — continuing.");
  }

  const cs = runAtlasJson([
    "clusters", "connectionStrings", "describe", cluster.name,
    "--projectId", projectId,
  ]);

  const srv = cs.standardSrv ?? cs.connectionStrings?.standardSrv ?? "";
  if (!srv.includes("mongodb+srv://")) throw new Error("Could not retrieve SRV connection string.");

  let uri = srv;
  if (uri.includes("<password>") || uri.includes("<username>")) {
    const host = uri.split("@")[1];
    uri = `mongodb+srv://${encodePassword(dbUser)}:${encodePassword(dbPassword)}@${host}`;
  } else {
    uri = uri.replace(/\/\?/, `/${dbName}?`).replace(/\/$/, `/${dbName}`);
  }

  if (!uri.includes(`/${dbName}`)) {
    uri = uri.includes("?") ? uri.replace("?", `/${dbName}?`) : `${uri}/${dbName}`;
  }

  writeFileSync(
    outputFile,
    JSON.stringify({
      clusterHost: cluster.connectionStrings?.standardSrv?.split("@")[1]?.split("/")[0] ?? null,
      databaseName: dbName,
      dbUser,
      clusterName: cluster.name,
      projectId,
      uri,
      provisionedAt: new Date().toISOString(),
    }, null, 2)
  );

  const jwtSecret = randomBytes(48).toString("base64url");
  const example = existsSync(resolve(process.cwd(), ".env.example"))
    ? readFileSync(resolve(process.cwd(), ".env.example"), "utf8")
    : "";

  const envContent = [
    "# Auto-generated for local development — do not commit",
    `MONGODB_URI=${uri}`,
    `JWT_SECRET=${jwtSecret}`,
    "NEXT_PUBLIC_APP_URL=http://localhost:3000",
    "",
    ...example.split(/\r?\n/).filter((l) => {
      const k = l.split("=")[0]?.trim();
      return l.trim() && !l.startsWith("# MongoDB") && !["MONGODB_URI", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"].includes(k);
    }),
  ].join("\n");

  writeFileSync(envLocal, envContent, "utf8");
  console.log("[Atlas-CLI] .env.local created.");
  try { unlinkSync(outputFile); } catch { /* ignore */ }
}

main().catch((e) => {
  console.error("[Atlas-CLI] Failed:", e.message);
  process.exit(1);
});
