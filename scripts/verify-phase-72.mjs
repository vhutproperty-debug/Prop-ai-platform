/**
 * Phase 7.2 verification — location intelligence module.
 */
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const { connectDB, disconnectDB } = await import("../lib/db/mongodb.ts");
const { nearbyPlaceService } = await import(
  "../services/location-intelligence/nearby-place.service.ts"
);
const { Project } = await import("../models/Project.ts");
const { NearbyPlace } = await import("../models/NearbyPlace.ts");
const { internalResearchService } = await import(
  "../services/content-engine/research/internal-research.service.ts"
);
const { POI_TYPES } = await import("../config/location-intelligence.ts");

const results = [];

function record(check, pass, detail) {
  results.push({ check, pass, detail });
  console.log(
    `[Verify 7.2] ${pass ? "PASS" : "FAIL"} — ${check}${detail ? `: ${detail}` : ""}`
  );
}

await connectDB();

const project = await Project.findOne({ slug: "seed-sample-project" }).lean();
if (!project) {
  record("Seed project exists", false, "Run npm run seed first");
  await disconnectDB();
  process.exit(1);
}

const projectId = String(project._id);

const places = await nearbyPlaceService.listByProject(projectId);
record("Nearby places loaded for seed project", places.length >= 3, `${places.length} places`);

const schoolCount = places.filter((p) => p.type === "school").length;
const hospitalCount = places.filter((p) => p.type === "hospital").length;
const metroCount = places.filter((p) => p.type === "metro").length;
record("School POI present", schoolCount >= 1);
record("Hospital POI present", hospitalCount >= 1);
record("Metro POI present", metroCount >= 1);

const syncResult = await nearbyPlaceService.syncFromFirecrawl(projectId, [
  { type: "mall", name: "Verify Test Mall", distance: "3 km", travelTime: "15 mins" },
]);
record("Firecrawl sync upserts", syncResult.synced === 1);

const schoolsValidation = await nearbyPlaceService.validateForContentType(
  projectId,
  "nearby_schools"
);
record("nearby_schools validation", schoolsValidation.ok);

const research = await internalResearchService.collectFromProject(projectId);
record(
  "Internal research includes nearbyPlaces",
  Array.isArray(research.nearbyPlaces) && research.nearbyPlaces.length >= 3,
  `${research.nearbyPlaces?.length ?? 0} items`
);

const testSlug = "__verify72__test-place";
const created = await nearbyPlaceService.upsertForProject(projectId, {
  type: "railway",
  name: "Verify Railway",
  slug: testSlug,
  distanceLabel: "4 km",
  source: "manual",
  confidence: "high",
  isActive: true,
});
record("Manual upsert", created.slug === testSlug);

await NearbyPlace.deleteOne({ slug: testSlug, projectId });
record("Cleanup test POI", true);

const allPass = results.every((r) => r.pass);
console.log(JSON.stringify({ results, allPass, poiTypes: POI_TYPES }, null, 2));

await disconnectDB();
process.exit(allPass ? 0 : 1);
