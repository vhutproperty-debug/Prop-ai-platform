/**
 * Firecrawl integration verification — connectivity + review-queue import (no publish).
 * Usage: node --require ./scripts/setup-dns.cjs ./node_modules/tsx/dist/cli.mjs scripts/verify-firecrawl-import.mjs [builderSlug] [projectUrl]
 */
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const builderSlug = process.argv[2] ?? "lodha";
const projectUrl = process.argv[3];

const { isFirecrawlConfigured, isDbConfigured, env } = await import("../config/env.ts");
const { firecrawlService } = await import("../services/firecrawl/firecrawl.service.ts");
const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
const { importJobsService } = await import("../services/import-jobs/import-jobs.service.ts");
const { User } = await import("../models/User.ts");
const { ImportJob } = await import("../models/ImportJob.ts");
const { ImportRecord } = await import("../models/ImportRecord.ts");
const { ImportLog } = await import("../models/ImportLog.ts");

const report = {
  env: {
    firecrawlConfigured: isFirecrawlConfigured,
    firecrawlKeyPresent: Boolean(env.FIRECRAWL_API_KEY?.length),
    databaseConfigured: isDbConfigured,
  },
  connectivity: null,
  import: null,
  reviewQueue: null,
  errors: [],
  warnings: [],
};

console.log("\n=== Firecrawl Integration Verification ===\n");

report.connectivity = await firecrawlService.testConnection();
console.log("[Firecrawl] Connectivity:", report.connectivity);

if (!report.connectivity.configured) {
  report.errors.push("FIRECRAWL_API_KEY missing — add it to .env.local");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!report.connectivity.ok) {
  report.errors.push(
    report.connectivity.error ?? "Firecrawl connectivity test failed"
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!isDbConfigured) {
  report.errors.push("MONGODB_URI is not configured");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

await connectDB();

const admin = await User.findOne({ role: "admin" }).select("_id email").lean();
if (!admin) {
  report.errors.push("No admin user — run npm run seed");
  await disconnectDB();
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const importStarted = performance.now();
console.log(`\n[Firecrawl] Importing single project: builder=${builderSlug}`);

let importResult;
try {
  importResult = await importJobsService.runSingleProjectImport({
    builderSlug,
    projectUrl,
    createdBy: String(admin._id),
  });
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  await disconnectDB();
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const importDurationMs = Math.round(performance.now() - importStarted);

const job = await ImportJob.findById(importResult.jobId).lean();
const records = await ImportRecord.find({ jobId: importResult.jobId }).lean();
const logs = await ImportLog.find({ jobId: importResult.jobId })
  .sort({ createdAt: 1 })
  .lean();

const pagesCrawled =
  logs.find((log) => log.meta?.pagesCrawled)?.meta?.pagesCrawled ??
  logs.filter((log) => log.url).length;

const projectsDetected =
  logs.find((log) => log.meta?.projectsDetected)?.meta?.projectsDetected ?? 1;

const validationFailures = records.filter(
  (record) => (record.validationErrors?.length ?? 0) > 0
).length;

const duplicateRecords = records.filter(
  (record) => record.recordType === "duplicate" || record.recordType === "update"
);

const reviewQueueRecords = records.filter((record) =>
  ["staged", "approved", "duplicate", "update", "conflict"].includes(
    String(record.status)
  )
);

report.import = {
  jobId: importResult.jobId,
  status: importResult.status,
  projectUrl: importResult.projectUrl,
  recordId: importResult.recordId,
  importDurationMs,
  pagesCrawled,
  projectsDetected,
  projectsNormalized: records.length,
  validationResults: {
    passed: records.length - validationFailures,
    failed: validationFailures,
  },
  duplicateDetection: {
    duplicates: duplicateRecords.length,
    recordTypes: records.map((record) => ({
      slug: record.slug,
      recordType: record.recordType,
      status: record.status,
      matchCount: record.duplicates?.length ?? 0,
    })),
  },
  errors: job?.errors ?? [],
  warnings: job?.warnings ?? [],
  logCount: logs.length,
};

report.reviewQueue = {
  jobStatus: job?.status,
  inReviewQueue: importResult.status === "pending_review",
  stagedRecords: reviewQueueRecords.length,
  autoPublished: records.some((record) => record.status === "published"),
  records: records.map((record) => ({
    id: String(record._id),
    slug: record.slug,
    displayName: record.displayName,
    status: record.status,
    recordType: record.recordType,
  })),
};

if (report.reviewQueue.autoPublished) {
  report.errors.push("Import auto-published — review queue bypass detected");
}

if (!report.reviewQueue.inReviewQueue && importResult.validationFailures) {
  report.warnings.push("Import job did not reach pending_review (validation failure)");
}

if (records.length === 0 && !importResult.validationFailures) {
  report.errors.push("No staged records created");
}

console.log("\n=== Import Report ===");
console.log(JSON.stringify(report, null, 2));

await disconnectDB();

const ok =
  report.errors.length === 0 &&
  report.reviewQueue.inReviewQueue &&
  !report.reviewQueue.autoPublished &&
  records.length >= 1;

process.exit(ok ? 0 : 1);
