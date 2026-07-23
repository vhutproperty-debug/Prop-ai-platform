/**
 * Smoke test — Project Intelligence Extractor (extract + optional save).
 * Usage: npm run verify:project-intelligence [projectUrl]
 */
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const projectUrl =
  process.argv[2] ??
  "https://www.lodhagroup.com/projects/mumbai/worli/lodha-park/";

const report = {
  env: {},
  extract: null,
  save: null,
  errors: [],
  warnings: [],
};

console.log("\n=== Project Intelligence Extractor Smoke Test ===\n");

const { isFirecrawlConfigured, isDbConfigured, env } = await import("../config/env.ts");
const { firecrawlService } = await import("../services/firecrawl/firecrawl.service.ts");
const { projectIntelligenceExtractorService } = await import(
  "../services/project-intelligence/project-intelligence-extractor.service.ts"
);

report.env = {
  firecrawlConfigured: isFirecrawlConfigured,
  firecrawlKeyPresent: Boolean(env.FIRECRAWL_API_KEY?.length),
  databaseConfigured: isDbConfigured,
};

const connectivity = await firecrawlService.testConnection();
console.log("[Firecrawl] Connectivity:", connectivity);

if (!connectivity.configured || !connectivity.ok) {
  report.errors.push(connectivity.error ?? "Firecrawl not configured or unreachable");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`\n[Extract] URL: ${projectUrl}\n`);
const started = performance.now();

let extraction;
try {
  extraction = await projectIntelligenceExtractorService.extract(projectUrl);
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const durationMs = Math.round(performance.now() - started);

report.extract = {
  projectName: extraction.project.projectName,
  builder: extraction.project.builder,
  reraNumber: extraction.project.reraNumber,
  pagesCrawled: extraction.meta.pagesCrawled,
  imageCount: extraction.meta.imageCount,
  floorPlanCount: extraction.meta.floorPlanCount,
  confidence: extraction.meta.extractionConfidence,
  crawlStatus: extraction.meta.crawlStatus,
  durationMs,
  configurationCount: extraction.configurations.length,
  amenityCount: extraction.amenities.length,
};

console.log("[Extract] Result:", report.extract);

if (!extraction.project.projectName) {
  report.errors.push("Missing project name");
}
if (extraction.meta.pagesCrawled < 1) {
  report.errors.push("No pages crawled");
}
if (extraction.meta.extractionConfidence < 0.2) {
  report.warnings.push("Very low extraction confidence");
}

if (isDbConfigured) {
  const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
  const { User } = await import("../models/User.ts");
  const { ProjectIntelligence } = await import("../models/ProjectIntelligence.ts");

  await connectDB();
  const admin = await User.findOne({ role: "admin" }).select("_id").lean();
  if (!admin) {
    report.warnings.push("No admin user — skipped save test");
  } else {
    try {
      const saved = await projectIntelligenceExtractorService.save(
        extraction,
        String(admin._id)
      );
      report.save = { id: saved.id, canonicalUrl: saved.canonicalUrl };
      console.log("[Save] OK:", report.save);
      await ProjectIntelligence.findByIdAndDelete(saved.id);
      console.log("[Save] Rolled back test record");
    } catch (error) {
      report.errors.push(
        `Save test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  await disconnectDB();
} else {
  report.warnings.push("MONGODB_URI not set — skipped save test");
}

console.log("\n=== Summary ===");
if (report.errors.length) {
  console.log("FAIL", report.errors.join("; "));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("PASS — Project Intelligence Extractor smoke test succeeded");
if (report.warnings.length) {
  console.log("Warnings:", report.warnings.join("; "));
}
process.exit(0);
