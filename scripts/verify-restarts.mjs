/**
 * Manual restart verification — 3 cycles, no secrets logged.
 */
import { spawn, execSync } from "child_process";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function killPort3000() {
  try {
    execSync(
      'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
      { stdio: "ignore" }
    );
  } catch {
    // ignore
  }
}

async function waitForHealthy(maxMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch("http://localhost:3000/api/health");
      const body = await res.json();
      if (body.mongodb?.status === "healthy") {
        return { ok: true, status: body.mongodb.status, responseTimeMs: body.mongodb.responseTimeMs };
      }
    } catch {
      // not ready
    }
    await sleep(4000);
  }
  return { ok: false };
}

async function runCycle(i) {
  killPort3000();
  await sleep(2000);

  const logs = [];
  const child = spawn("npm", ["run", "dev"], {
    cwd: process.cwd(),
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (d) => logs.push(d.toString()));
  child.stderr.on("data", (d) => logs.push(d.toString()));

  await sleep(12000);
  const health = await waitForHealthy();
  const log = logs.join("");

  child.kill("SIGTERM");
  await sleep(2000);

  return {
    cycle: i + 1,
    health,
    overwriteModel: /OverwriteModelError/i.test(log),
    duplicateConnection: /multiple connections|already connected to a different database/i.test(log),
    dnsFailure: /querySrv ECONNREFUSED/i.test(log),
    connectedLog: /\[MongoDB\] Connected/.test(log),
  };
}

const results = [];
for (let i = 0; i < 3; i++) {
  console.log(`[Restart] Cycle ${i + 1}/3`);
  results.push(await runCycle(i));
  await sleep(3000);
}

console.log(JSON.stringify({ results }, null, 2));

const pass = results.every(
  (r) => r.health.ok && !r.overwriteModel && !r.duplicateConnection && !r.dnsFailure
);
process.exit(pass ? 0 : 1);
