/**
 * Phase 7.3 verification — never prints secrets.
 * Usage: node scripts/verify-database.mjs [baseUrl]
 */
const baseUrl = process.argv[2] ?? "http://localhost:3000";

async function fetchJson(path) {
  const res = await fetch(`${baseUrl}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

function summarizeHealth(body) {
  const m = body.mongodb ?? {};
  return {
    httpStatus: body.status,
    mongodbStatus: m.status,
    connected: m.connected,
    databaseName: m.databaseName,
    clusterHost: m.cluster?.host ?? null,
    isAtlas: m.cluster?.isAtlas ?? null,
    responseTimeMs: m.responseTimeMs,
    collectionCount: Array.isArray(m.collections) ? m.collections.length : 0,
    lastError: m.lastError,
  };
}

async function main() {
  console.log("[Verify] Checking /api/health ...");
  const health = await fetchJson("/api/health");
  console.log("[Verify] Health:", JSON.stringify(summarizeHealth(health.body), null, 2));

  if (health.body.mongodb?.status !== "healthy") {
    process.exitCode = 1;
    return;
  }

  console.log("[Verify] Health check passed.");
}

main().catch((err) => {
  console.error("[Verify] Failed:", err.message);
  process.exitCode = 1;
});
