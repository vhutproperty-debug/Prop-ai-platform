/**
 * Phase 7.5 verification — Mission Control dashboard.
 */
import { existsSync } from "node:fs";
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const results = [];

function record(check, pass, detail) {
  results.push({ check, pass, detail });
  console.log(
    `[Verify 7.5] ${pass ? "PASS" : "FAIL"} — ${check}${detail ? `: ${detail}` : ""}`
  );
}

const requiredFiles = [
  "types/mission-control.ts",
  "config/mission-control.ts",
  "services/mission-control/mission-control.service.ts",
  "services/mission-control/platform-health.service.ts",
  "services/mission-control/global-search.service.ts",
  "validations/mission-control.ts",
  "app/api/admin/mission-control/route.ts",
  "app/api/admin/mission-control/search/route.ts",
  "app/admin/mission-control/page.tsx",
  "app/admin/mission-control/layout.tsx",
  "components/admin/mission-control/mission-control-dashboard.tsx",
  "components/admin/mission-control/mission-control-executive.tsx",
  "config/mission-control-v2.ts",
  "services/mission-control/project-analytics.service.ts",
  "services/mission-control/executive-intelligence.service.ts",
];

for (const file of requiredFiles) {
  record(`File exists: ${file}`, existsSync(file));
}

const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
const { missionControlService } = await import(
  "../services/mission-control/mission-control.service.ts"
);
const { missionControlSearchService } = await import(
  "../services/mission-control/global-search.service.ts"
);
const { MISSION_CONTROL_PIPELINE_STAGES, MISSION_CONTROL_REFRESH_MS } = await import(
  "../config/mission-control.ts"
);

record("Pipeline stages defined", MISSION_CONTROL_PIPELINE_STAGES.length >= 10);
record("Refresh interval configured", MISSION_CONTROL_REFRESH_MS === 30_000);

await connectDB();

const dashboard = await missionControlService.getDashboard();
record("getDashboard returns kpis", typeof dashboard.kpis.totalProjects === "number");
record(
  "getDashboard returns platform health",
  Array.isArray(dashboard.platformHealth) && dashboard.platformHealth.length >= 5
);
record("getDashboard returns import engine", typeof dashboard.importEngine.successRate === "number");
record("getDashboard returns pipeline stages", dashboard.pipelineStages.length >= 10);
record("getDashboard returns alerts array", Array.isArray(dashboard.alerts));
record("getDashboard returns activity", Array.isArray(dashboard.activity));
record("Revenue placeholder flagged", dashboard.revenue.isPlaceholder === true);
record("Executive v2 readiness score", typeof dashboard.executive.platformReadiness.overall === "number");
record("Executive v2 today snapshot", typeof dashboard.executive.todaySnapshot.leadsReceivedToday === "number");
record("Executive v2 action queue", Array.isArray(dashboard.executive.actionRequired));
record("Executive v2 project completion", Array.isArray(dashboard.executive.projectCompletion));
record("Executive v2 builder performance", dashboard.executive.builderPerformance.length >= 1);
record("Executive v2 global health report", dashboard.executive.globalHealthReport.rows.length >= 5);
record("Executive v2 executive timeline", dashboard.executive.executiveTimeline.length >= 0);
record("Executive v2 smart notifications", Array.isArray(dashboard.executive.smartNotifications));
record("Executive v2 data quality score", typeof dashboard.executive.dataQuality.score === "number");

const searchEmpty = await missionControlSearchService.search("a");
record("Search requires 2+ chars", searchEmpty.length === 0);

await disconnectDB();

const failed = results.filter((r) => !r.pass).length;
console.log(`\n[Verify 7.5] ${results.length - failed}/${results.length} checks passed`);
process.exit(failed > 0 ? 1 : 0);
