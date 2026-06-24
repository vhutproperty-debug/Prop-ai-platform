import {
  Amenity,
  Builder,
  Configuration,
  FAQ,
  Image,
  ImportJob,
  ImportRecord,
  Lead,
  Location,
  Project,
} from "@/models";

/**
 * Ensures all production indexes are created in MongoDB.
 * Call after mongoose.connect() — Mongoose syncs index definitions.
 */
export async function ensureIndexes(): Promise<void> {
  await Promise.all([
    Builder.syncIndexes(),
    Project.syncIndexes(),
    Configuration.syncIndexes(),
    Amenity.syncIndexes(),
    FAQ.syncIndexes(),
    Location.syncIndexes(),
    Lead.syncIndexes(),
    Image.syncIndexes(),
    ImportJob.syncIndexes(),
    ImportRecord.syncIndexes(),
  ]);
}

export const INDEX_DOCUMENTATION = {
  Builder: [
    "slug (unique)",
    "name",
    "rating",
    "isActive + isFeatured + rating (compound)",
    "text: name, tagline, description",
  ],
  Project: [
    "slug (unique)",
    "builderId, builderName, projectName, location, microMarket",
    "priceRange.min, priceRange.max",
    "featured + status + isActive (compound)",
    "latitude + longitude (geo)",
    "possessionDate + status",
    "text: projectName, builderName, locationName, microMarket, description",
  ],
  Configuration: [
    "projectId + slug (unique compound)",
    "type + bhk + isActive",
    "priceRange.min + priceRange.max",
  ],
  Amenity: ["slug (unique)", "category + isActive", "text: name, description"],
  FAQ: ["entityType + entityId + order", "text: question, answer"],
  Location: [
    "slug (unique)",
    "city + microMarket + isActive",
    "investmentScore + rentalScore",
    "latitude + longitude",
    "text: name, microMarket, description",
  ],
  Lead: [
    "email, phone, status, source",
    "status + createdAt",
    "projectId + status",
    "assignedTo + status + createdAt",
    "text: name, email, phone, query",
  ],
  Image: [
    "entityType + entityId + type + order",
    "publicId (unique sparse)",
  ],
  ImportJob: ["source + createdAt", "status + createdAt", "createdBy + createdAt"],
  ImportRecord: [
    "jobId + status",
    "slug + status",
    "status + createdAt",
    "stagedData.project.reraNumber (sparse)",
  ],
} as const;
