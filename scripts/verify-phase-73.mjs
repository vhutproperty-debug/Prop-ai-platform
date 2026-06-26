/**
 * Phase 7.3 verification — no secrets in output.
 */
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const baseUrl = process.argv[2] ?? "http://localhost:3000";

async function checkHealth() {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${baseUrl}/api/health`);
    const body = await res.json();
    const m = body.mongodb ?? {};
    last = {
      httpStatus: res.status,
      status: m.status,
      connected: m.connected,
      databaseName: m.databaseName,
      responseTimeMs: m.responseTimeMs,
      collectionCount: Array.isArray(m.collections) ? m.collections.length : 0,
      isAtlas: m.cluster?.isAtlas ?? false,
      lastError: m.lastError,
    };
    if (last.status === "healthy") return last;
  }
  return last;
}

async function checkCrud() {
  const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
  const { crudVerificationService } = await import(
    "../services/database/crud-verification.service.ts"
  );

  await connectDB();
  const results = await crudVerificationService.runAll();
  await disconnectDB();

  return results.map((r) => ({
    entity: r.entity,
    pass: r.create && r.read && r.update && r.delete,
    create: r.create,
    read: r.read,
    update: r.update,
    delete: r.delete,
    durationMs: r.durationMs,
    error: r.error,
  }));
}

console.log("[Verify] Health check...");
const health = await checkHealth();
console.log(JSON.stringify({ health }, null, 2));

console.log("[Verify] CRUD verification...");
const crud = await checkCrud();
const allPass = crud.every((r) => r.pass);
console.log(JSON.stringify({ crud, allPass }, null, 2));

process.exit(health.status === "healthy" && allPass ? 0 : 1);
