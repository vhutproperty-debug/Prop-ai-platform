import { isFirecrawlConfigured } from "@/config/env";
import { PROJECT_INTELLIGENCE_MAX_SUBPAGES } from "@/config/project-intelligence";
import { withDatabase } from "@/lib/db/with-database";
import { ProjectIntelligence } from "@/models/ProjectIntelligence";
import { resolveCanonicalProjectUrl } from "@/services/extraction/project-url.utils";
import { firecrawlService } from "@/services/firecrawl/firecrawl.service";
import type { FirecrawlScrapeResult } from "@/services/firecrawl/firecrawl.service";
import {
  buildProjectIntelligenceReport,
  discoverProjectSubpages,
} from "@/services/project-intelligence/intelligence-parser";
import type {
  ProjectIntelligenceReport,
  SavedProjectIntelligence,
} from "@/types/project-intelligence";

async function scrapeUrlSafe(
  url: string
): Promise<{ scrape?: FirecrawlScrapeResult; error?: string }> {
  try {
    const scrape = await firecrawlService.scrapeUrl(url);
    return { scrape };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Scrape failed",
    };
  }
}

async function scrapeInBatches(
  urls: string[],
  batchSize = 3
): Promise<{
  scrapes: FirecrawlScrapeResult[];
  errors: string[];
  warnings: string[];
}> {
  const scrapes: FirecrawlScrapeResult[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((url) => scrapeUrlSafe(url)));
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const url = batch[j];
      if (result.scrape) {
        if ((result.scrape.markdown?.length ?? 0) < 100) {
          warnings.push(`Sparse content on ${url}`);
        }
        scrapes.push(result.scrape);
      } else if (result.error) {
        errors.push(`${url}: ${result.error}`);
      }
    }
  }

  return { scrapes, errors, warnings };
}

export const projectIntelligenceExtractorService = {
  async extract(sourceUrl: string): Promise<ProjectIntelligenceReport> {
    if (!isFirecrawlConfigured) {
      throw new Error("FIRECRAWL_API_KEY is required for Project Intelligence extraction");
    }

    const started = Date.now();
    const canonicalUrl = resolveCanonicalProjectUrl(sourceUrl);
    const errors: string[] = [];
    const warnings: string[] = [];

    const mainResult = await scrapeUrlSafe(canonicalUrl);
    if (!mainResult.scrape) {
      throw new Error(mainResult.error ?? "Failed to scrape project URL");
    }

    const subpages = discoverProjectSubpages(
      mainResult.scrape.links,
      canonicalUrl
    ).slice(0, PROJECT_INTELLIGENCE_MAX_SUBPAGES);

    const urlsToScrape = [
      canonicalUrl,
      ...subpages.filter((u) => u !== canonicalUrl),
    ];

    const batchResult = await scrapeInBatches(urlsToScrape);
    const scrapes =
      batchResult.scrapes.length > 0 ? batchResult.scrapes : [mainResult.scrape];

    errors.push(...batchResult.errors);
    warnings.push(...batchResult.warnings);

    const crawlStatus =
      errors.length && scrapes.length <= 1
        ? "partial"
        : errors.length
          ? "partial"
          : "completed";

    return buildProjectIntelligenceReport({
      sourceUrl,
      scrapes,
      durationMs: Date.now() - started,
      crawlStatus,
      errors,
      warnings,
      firecrawlConfigured: true,
    });
  },

  async save(
    report: ProjectIntelligenceReport,
    createdBy?: string
  ): Promise<SavedProjectIntelligence> {
    const doc = await withDatabase(() =>
      ProjectIntelligence.create({
        sourceUrl: report.meta.sourceUrl,
        canonicalUrl: report.meta.canonicalUrl,
        schemaVersion: report.meta.schemaVersion,
        report,
        createdBy,
      })
    );

    return {
      id: String(doc._id),
      sourceUrl: doc.sourceUrl,
      canonicalUrl: doc.canonicalUrl,
      schemaVersion: doc.schemaVersion,
      report: doc.report as ProjectIntelligenceReport,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  },

  async getById(id: string): Promise<SavedProjectIntelligence | null> {
    const doc = await withDatabase(() => ProjectIntelligence.findById(id).lean());
    if (!doc) return null;
    return {
      id: String(doc._id),
      sourceUrl: doc.sourceUrl,
      canonicalUrl: doc.canonicalUrl,
      schemaVersion: doc.schemaVersion,
      report: doc.report as ProjectIntelligenceReport,
      createdAt: new Date(doc.createdAt).toISOString(),
      updatedAt: new Date(doc.updatedAt).toISOString(),
    };
  },
};
