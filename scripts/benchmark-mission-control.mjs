import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
const { missionControlService } = await import(
  "../services/mission-control/mission-control.service.ts"
);

const t0 = performance.now();
await connectDB();
const t1 = performance.now();

const cold = await missionControlService.getDashboard(undefined, {
  bypassCache: true,
});
const t2 = performance.now();

const cached = await missionControlService.getDashboard();
const t3 = performance.now();

const builders = await missionControlService.getBuilderManagement();
const t4 = performance.now();

const payload = JSON.stringify(cold);

console.log(
  JSON.stringify(
    {
      connectMs: Math.round(t1 - t0),
      dashboardColdMs: Math.round(t2 - t1),
      dashboardCachedMs: Math.round(t3 - t2),
      cacheHit: Boolean(cached.generatedAt),
      builderManagementMs: Math.round(t4 - t3),
      totalMs: Math.round(t4 - t0),
      payloadKb: Math.round(payload.length / 1024),
      builderRows: builders.length,
    },
    null,
    2
  )
);

await disconnectDB();
