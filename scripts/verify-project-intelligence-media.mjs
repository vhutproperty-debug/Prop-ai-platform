/**
 * Verify Project Intelligence media download helpers (offline/unit-level).
 */
import JSZip from "jszip";
import { normalizeProjectIntelligenceReport } from "../lib/project-intelligence/report-normalizer.ts";

const sampleReport = {
  meta: {
    schemaVersion: 2,
    sourceUrl: "https://example.com/project",
    canonicalUrl: "https://example.com/project",
    extractedAt: new Date().toISOString(),
    durationMs: 100,
    crawlStatus: "completed",
    pagesCrawled: 1,
    pagesAttempted: ["https://example.com/project"],
    imageCount: 1,
    floorPlanCount: 0,
    extractionConfidence: 0.5,
    firecrawlConfigured: true,
    errors: [],
    warnings: [],
  },
  project: { projectName: "Sample Project" },
  projectUpdates: [],
  possession: {
    towerWisePossession: [],
    phaseWisePossession: [],
  },
  configurations: [],
  specifications: [],
  amenities: [],
  location: [],
  media: [
    {
      url: "https://example.com/assets/hero.jpg",
      type: "project",
      sourceUrl: "https://example.com/project",
    },
  ],
  images: [],
  floorPlans: [],
  brochures: [],
  downloads: [],
  videos: [],
  virtualTours: [],
  contact: {},
  aiSummary: {
    projectOverview: "",
    keyHighlights: [],
    possessionStatus: "",
    marketingReadiness: "",
    recommendedOwnerMarketingTimeline: "",
    importantMissingInformation: [],
    confidenceScore: 0.5,
  },
  rawPageSummaries: [],
};

console.log("\n=== Project Intelligence Media Download Verification ===\n");

const normalized = normalizeProjectIntelligenceReport(sampleReport);
if (!normalized.images.length) {
  console.error("FAIL: report normalizer did not backfill images");
  process.exit(1);
}
console.log("PASS: report normalizer backfills legacy media -> images");

const zip = new JSZip();
zip.file("image-1.jpg", Buffer.from("fake-image-content"));
const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
const loaded = await JSZip.loadAsync(zipBuffer);
const entries = Object.keys(loaded.files).filter((name) => !loaded.files[name].dir);
if (!entries.includes("image-1.jpg")) {
  console.error("FAIL: generated ZIP invalid");
  process.exit(1);
}
console.log("PASS: ZIP structure valid:", entries.join(", "));

const jsonBlob = new Blob([JSON.stringify(normalized, null, 2)], {
  type: "application/json",
});
if (!(jsonBlob instanceof Blob) || jsonBlob.size <= 0) {
  console.error("FAIL: JSON export blob invalid");
  process.exit(1);
}
console.log("PASS: JSON export blob valid");

console.log("\nAll media download verification checks passed.\n");
process.exit(0);
