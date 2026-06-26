/**
 * Phase 7.4 verification — validates first-import workflow artifacts.
 * Usage: node --require ./scripts/setup-dns.cjs ./node_modules/tsx/dist/cli.mjs scripts/verify-phase-74.mjs [projectSlug]
 */
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const projectSlug = process.argv[2];
const baseUrl = process.argv[3] ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
const { Project } = await import("../models/Project.ts");
const { ImportRecord } = await import("../models/ImportRecord.ts");
const { ContentArticle } = await import("../models/ContentArticle.ts");
const { NearbyPlace } = await import("../models/NearbyPlace.ts");
const { siteSitemapService } = await import("../services/sitemap/site-sitemap.service.ts");
const { PUBLISH_CONTENT_CLUSTER } = await import("../config/publish-workflow.ts");

const results = [];

function record(check, pass, detail) {
  results.push({ check, pass, detail });
  console.log(`[Verify 7.4] ${pass ? "PASS" : "FAIL"} — ${check}${detail ? `: ${detail}` : ""}`);
}

await connectDB();

let slug = projectSlug;
if (!slug) {
  const latest = await ImportRecord.findOne({ status: "published" })
    .sort({ reviewedAt: -1 })
    .lean();
  slug = latest?.slug;
}

if (!slug) {
  record("Published import exists", false, "Run scripts/run-phase-74-import.mjs first");
  await disconnectDB();
  process.exit(1);
}

const project = await Project.findOne({ slug, isActive: true }).lean();
record("Active project in MongoDB", Boolean(project), slug);

if (project) {
  record("Project name populated", Boolean(project.projectName));
  record("Builder name populated", Boolean(project.builderName));
  record("Price range populated", Boolean(project.priceRange?.min && project.priceRange?.max));
  record("Location linked", Boolean(project.location));
  record("SEO title", Boolean(project.seoTitle));
  record("SEO description", Boolean(project.seoDescription));

  const nearbyCount = await NearbyPlace.countDocuments({ projectId: project._id, isActive: true });
  record("Nearby places (if extracted)", nearbyCount >= 0, `${nearbyCount} places`);

  const articles = await ContentArticle.find({
    projectId: project._id,
    status: "published",
  }).select("slug title contentType internalLinks").lean();

  record(
    "Content cluster generated",
    articles.length >= 1,
    `${articles.length}/${PUBLISH_CONTENT_CLUSTER.length} articles`
  );

  const linksToProject = articles.filter((a) =>
    (a.internalLinks ?? []).some((link) =>
      String(link.href ?? "").includes(`/project/${slug}`)
    )
  );
  record("Articles link to project", linksToProject.length >= 1, `${linksToProject.length} articles`);

  const sitemap = await siteSitemapService.buildAllEntries();
  record(
    "Project in sitemap",
    sitemap.some((e) => e.loc.includes(`/project/${slug}`))
  );
  record(
    "Articles in sitemap",
    articles.every((a) => sitemap.some((e) => e.loc.includes(`/articles/${a.slug}`))),
    `${articles.length} checked`
  );

  try {
    const pageRes = await fetch(`${baseUrl}/project/${slug}`, { redirect: "follow" });
    record("Landing page HTTP", pageRes.ok, String(pageRes.status));
  } catch (error) {
    record(
      "Landing page HTTP",
      false,
      error instanceof Error ? error.message : "fetch failed — start dev server"
    );
  }

  try {
    const sitemapRes = await fetch(`${baseUrl}/api/sitemap`);
    const body = await sitemapRes.json();
    record("Sitemap API", sitemapRes.ok && body.success, `${body.data?.count ?? 0} entries`);
  } catch (error) {
    record("Sitemap API", false, error instanceof Error ? error.message : "fetch failed");
  }
}

const duplicateCount = await Project.countDocuments({ slug });
record("No duplicate slug", duplicateCount === 1, `${duplicateCount} records`);

const allPass = results.every((r) => r.pass);
console.log(JSON.stringify({ results, allPass, projectSlug: slug, baseUrl }, null, 2));

await disconnectDB();
process.exit(allPass ? 0 : 1);
