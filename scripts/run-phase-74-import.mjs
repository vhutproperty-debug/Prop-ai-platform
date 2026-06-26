/**
 * Phase 7.4 — run first real import + publish workflow.
 * Usage: node --require ./scripts/setup-dns.cjs ./node_modules/tsx/dist/cli.mjs scripts/run-phase-74-import.mjs [builderSlug] [projectUrl]
 */
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const builderSlug = process.argv[2] ?? "lodha";
const projectUrl = process.argv[3];

const { isFirecrawlConfigured, isDbConfigured } = await import("../config/env.ts");
const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
const { importJobsService } = await import("../services/import-jobs/import-jobs.service.ts");
const { importReviewService } = await import("../services/import-review.service.ts");
const { publishOrchestratorService } = await import(
  "../services/publish-workflow/publish-orchestrator.service.ts"
);
const { User } = await import("../models/User.ts");
const { ImportRecord } = await import("../models/ImportRecord.ts");
const { Project } = await import("../models/Project.ts");
const { ContentArticle } = await import("../models/ContentArticle.ts");
const { siteSitemapService } = await import("../services/sitemap/site-sitemap.service.ts");

if (!isDbConfigured) {
  console.error("[Phase 7.4] MONGODB_URI is not configured");
  process.exit(1);
}

if (!isFirecrawlConfigured) {
  console.error("[Phase 7.4] FIRECRAWL_API_KEY is required for real import");
  process.exit(1);
}

await connectDB();

const admin = await User.findOne({ role: "admin" }).select("_id email").lean();
if (!admin) {
  console.error("[Phase 7.4] No admin user found — run npm run seed");
  await disconnectDB();
  process.exit(1);
}

console.log(`[Phase 7.4] Importing single project from builder: ${builderSlug}`);
const importResult = await importJobsService.runSingleProjectImport({
  builderSlug,
  projectUrl,
  createdBy: String(admin._id),
});

console.log("[Phase 7.4] Import result:", {
  jobId: importResult.jobId,
  status: importResult.status,
  recordId: importResult.recordId,
  projectUrl: importResult.projectUrl,
  validationFailures: importResult.validationFailures,
});

if (!importResult.recordId || importResult.validationFailures) {
  console.error("[Phase 7.4] Import failed or no record staged");
  await disconnectDB();
  process.exit(1);
}

const record = await ImportRecord.findById(importResult.recordId).lean();
console.log("[Phase 7.4] Staged record:", {
  slug: record?.slug,
  displayName: record?.displayName,
  status: record?.status,
  recordType: record?.recordType,
});

await importReviewService.approveRecord(
  importResult.recordId,
  String(admin._id),
  "Phase 7.4 automated approval"
);

console.log("[Phase 7.4] Publishing with content cluster...");
const publishResult = await publishOrchestratorService.publishImportRecord(
  importResult.recordId,
  String(admin._id)
);

const project = await Project.findById(publishResult.projectId).lean();
const articles = await ContentArticle.find({
  projectId: publishResult.projectId,
  status: "published",
}).select("slug title contentType").lean();

const sitemap = await siteSitemapService.buildAllEntries();
const inSitemap = sitemap.some((e) => e.loc.includes(publishResult.projectSlug));

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

console.log("\n=== Phase 7.4 Import Summary ===");
console.log("Project:", project?.projectName);
console.log("Slug:", publishResult.projectSlug);
console.log("Landing page:", `${baseUrl}/project/${publishResult.projectSlug}`);
console.log("SEO updated:", publishResult.seoUpdated);
console.log("Indexed:", publishResult.indexed);
console.log("Articles published:", publishResult.contentCluster.publishedSlugs.length);
for (const article of articles) {
  console.log(`  - ${article.title}: ${baseUrl}/articles/${article.slug}`);
}
console.log("In sitemap:", inSitemap);
console.log("Content errors:", publishResult.contentCluster.errors);

await disconnectDB();
const publishedOk = Boolean(project?.isActive);
const contentOk = publishResult.contentCluster.publishedSlugs.length >= 1;
process.exit(publishedOk && contentOk ? 0 : 1);
