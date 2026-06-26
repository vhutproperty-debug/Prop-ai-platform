import {
  Amenity,
  Builder,
  Configuration,
  FAQ,
  Image,
  ImportJob,
  ImportRecord,
  ImportLog,
  ContentArticle,
  ContentVersion,
  ContentJob,
  ContentCampaign,
  ContentAuditLog,
  ContentKnowledgePack,
  ContentPerformance,
  Lead,
  Location,
  Project,
  SiteSettings,
} from "@/models";

/**
 * Ensures all production indexes are created in MongoDB.
 * Call after mongoose.connect() — Mongoose syncs index definitions.
 */
async function syncModelIndexes(model: {
  syncIndexes: () => Promise<string[]>;
  collection: { dropIndex: (name: string) => Promise<unknown> };
}) {
  try {
    await model.syncIndexes();
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 86) throw error;
    await model.collection.dropIndex("publicId_1").catch(() => undefined);
    await model.syncIndexes();
  }
}

export async function ensureIndexes(): Promise<void> {
  const models = [
    Builder,
    Project,
    Configuration,
    Amenity,
    FAQ,
    Location,
    Lead,
    Image,
    ImportJob,
    ImportRecord,
    ImportLog,
    ContentArticle,
    ContentVersion,
    ContentJob,
    ContentCampaign,
    ContentAuditLog,
    ContentKnowledgePack,
    ContentPerformance,
    SiteSettings,
  ];

  await Promise.all(models.map((m) => syncModelIndexes(m)));
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
    "email, phone, status, source, score",
    "status + score + createdAt",
    "source + status + createdAt",
    "assignedTo + status + createdAt",
    "projectId + status + createdAt",
    "projectSlug + createdAt",
    "createdAt",
    "text: name, email, phone, configuration, purpose, projectSlug, query",
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
    "recordType + status + createdAt",
    "stagedData.project.reraNumber (sparse)",
  ],
  ImportLog: [
    "jobId + level + createdAt",
    "projectSlug + createdAt",
    "createdAt",
  ],
  ContentArticle: [
    "slug (unique)",
    "status + scheduledAt",
    "contentType + status + publishedAt",
    "projectSlug + contentType",
    "seoScore, readabilityScore",
    "text: title, introduction, featuredSummary, keywords",
  ],
  ContentVersion: ["articleId + version (unique compound)"],
  ContentJob: ["status + createdAt", "type + status"],
  ContentCampaign: ["type + scheduledAt", "slug (unique)"],
  ContentAuditLog: ["articleId + createdAt", "action + createdAt"],
  ContentKnowledgePack: [
    "projectId + contentType + createdAt",
    "lowConfidenceCount",
    "dataCompleteness",
  ],
  ContentPerformance: [
    "articleId (unique)",
    "contentDecayScore + organicTraffic",
    "leadsGenerated + conversions",
  ],
} as const;
