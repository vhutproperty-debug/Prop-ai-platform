import {
  COMPLETION_CHECKLIST_KEYS,
  COMPLETION_CHECKLIST_LABELS,
} from "@/config/mission-control-v2";
import { POI_TYPE_LABELS } from "@/config/mission-control";
import { withDatabase } from "@/lib/db/with-database";
import { Project } from "@/models/Project";
import { NearbyPlace } from "@/models/NearbyPlace";
import { ContentArticle } from "@/models/ContentArticle";
import { Image } from "@/models/Image";
import { ImportRecord } from "@/models/ImportRecord";
import type {
  LocationIntelligenceMetrics,
  ProjectCompletionScore,
  ProjectFactoryMetrics,
} from "@/types/mission-control";

export interface ProjectAnalyticsRow {
  _id: string;
  slug: string;
  projectName: string;
  builderName: string;
  locationName?: string;
  locationId?: string;
  checklist: ProjectCompletionScore["checklist"];
  completionPercent: number;
  missingItems: string[];
}

export interface ProjectAnalyticsSnapshot {
  activeCount: number;
  inactiveCount: number;
  archivedCount: number;
  importedCount: number;
  rows: ProjectAnalyticsRow[];
  missing: ProjectFactoryMetrics["missing"];
  projectsMissingPoi: number;
  poiByType: Record<string, number>;
  missingCoordinates: number;
  missingSeo: number;
  missingMetaDescriptions: number;
  missingMandatoryFields: number;
  brokenImages: number;
  invalidUrls: number;
  avgCompletionPercent: number;
  mediaCompletePercent: number;
  poiCompletePercent: number;
}

function computeChecklist(input: {
  description?: string;
  tagline?: string;
  priceMin?: number;
  galleryLength: number;
  hasFloorPlan: boolean;
  amenitiesLength: number;
  configurationsLength: number;
  poiCount: number;
  seoTitle?: string;
  seoDescription?: string;
  blogCount: number;
  hasSchema: boolean;
  hasInternalLinks: boolean;
  isActive: boolean;
}): ProjectCompletionScore["checklist"] {
  return {
    projectData: Boolean(
      input.description?.trim() && input.tagline?.trim() && input.priceMin
    ),
    gallery: input.galleryLength > 0,
    floorPlans: input.hasFloorPlan,
    amenities: input.amenitiesLength > 0,
    configurations: input.configurationsLength > 0,
    nearbyPlaces: input.poiCount > 0,
    seo: Boolean(input.seoTitle?.trim() && input.seoDescription?.trim()),
    blogs: input.blogCount > 0,
    schema: input.hasSchema,
    leadForm: input.isActive,
    internalLinks: input.hasInternalLinks,
  };
}

function checklistToScore(checklist: ProjectCompletionScore["checklist"]): {
  percent: number;
  missing: string[];
} {
  const missing: string[] = [];
  let complete = 0;

  for (const key of COMPLETION_CHECKLIST_KEYS) {
    if (checklist[key]) complete += 1;
    else missing.push(COMPLETION_CHECKLIST_LABELS[key]);
  }

  return {
    percent: Math.round((complete / COMPLETION_CHECKLIST_KEYS.length) * 100),
    missing,
  };
}

export const projectAnalyticsService = {
  async buildSnapshot(): Promise<ProjectAnalyticsSnapshot> {
    return withDatabase(async () => {
      const [
        projects,
        poiCounts,
        blogCounts,
        schemaProjects,
        internalLinkProjects,
        poiByTypeRaw,
        brokenImages,
        invalidUrls,
        counts,
      ] = await Promise.all([
        Project.find()
          .select(
            "slug projectName builderName location locationName gallery amenities configurations priceRange seoTitle seoDescription latitude longitude description tagline isActive status"
          )
          .lean(),
        NearbyPlace.aggregate<{ _id: unknown; count: number }>([
          { $match: { isActive: true } },
          { $group: { _id: "$projectId", count: { $sum: 1 } } },
        ]),
        ContentArticle.aggregate<{ _id: unknown; count: number }>([
          {
            $match: {
              status: "published",
              projectId: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: "$projectId", count: { $sum: 1 } } },
        ]),
        ContentArticle.distinct("projectId", {
          schemaData: { $exists: true, $ne: null },
          projectId: { $exists: true, $ne: null },
        }),
        ContentArticle.distinct("projectId", {
          internalLinks: { $exists: true, $not: { $size: 0 } },
          projectId: { $exists: true, $ne: null },
        }),
        NearbyPlace.aggregate<{ _id: string; count: number }>([
          { $match: { isActive: true } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
        Image.countDocuments({
          isActive: true,
          $or: [{ url: "" }, { url: { $exists: false } }],
        }),
        Image.countDocuments({
          isActive: true,
          url: { $regex: /^(\s|#|javascript:)/i },
        }),
        Promise.all([
          Project.countDocuments({ isActive: true }),
          Project.countDocuments({ isActive: false }),
          Project.countDocuments({ status: "sold_out" }),
          ImportRecord.countDocuments({ status: "published" }),
        ]),
      ]);

      const poiMap = new Map(
        poiCounts.map((row) => [String(row._id), row.count as number])
      );
      const blogMap = new Map(
        blogCounts.map((row) => [String(row._id), row.count as number])
      );
      const schemaSet = new Set(schemaProjects.map(String));
      const internalLinkSet = new Set(internalLinkProjects.map(String));

      const allGalleryIds = projects.flatMap((p) => p.gallery ?? []);
      const floorPlanIds = allGalleryIds.length
        ? await Image.find({
            _id: { $in: allGalleryIds },
            type: "floorplan",
            isActive: true,
          })
            .select("_id")
            .lean()
        : [];
      const floorPlanSet = new Set(floorPlanIds.map((img) => String(img._id)));

      const missing: ProjectFactoryMetrics["missing"] = {
        images: 0,
        floorPlans: 0,
        nearbyPlaces: 0,
        pricing: 0,
        amenities: 0,
        configurations: 0,
      };

      let projectsMissingPoi = 0;
      let missingCoordinates = 0;
      let missingSeo = 0;
      let missingMetaDescriptions = 0;
      let missingMandatoryFields = 0;
      let completionSum = 0;
      let mediaComplete = 0;
      let poiComplete = 0;
      let activeCount = 0;

      const rows: ProjectAnalyticsRow[] = [];

      for (const project of projects) {
        if (!project.isActive) continue;
        activeCount += 1;

        const projectId = String(project._id);
        const gallery = project.gallery ?? [];
        const poiCount = poiMap.get(projectId) ?? 0;
        const blogCount = blogMap.get(projectId) ?? 0;
        const hasFloorPlan = gallery.some((id: unknown) =>
          floorPlanSet.has(String(id))
        );

        const checklist = computeChecklist({
          description: project.description,
          tagline: project.tagline,
          priceMin: project.priceRange?.min,
          galleryLength: gallery.length,
          hasFloorPlan,
          amenitiesLength: project.amenities?.length ?? 0,
          configurationsLength: project.configurations?.length ?? 0,
          poiCount,
          seoTitle: project.seoTitle,
          seoDescription: project.seoDescription,
          blogCount,
          hasSchema: schemaSet.has(projectId),
          hasInternalLinks: internalLinkSet.has(projectId),
          isActive: Boolean(project.isActive),
        });

        const { percent, missing: missingItems } = checklistToScore(checklist);
        completionSum += percent;

        if (!checklist.gallery) missing.images += 1;
        if (!checklist.floorPlans) missing.floorPlans += 1;
        if (!checklist.nearbyPlaces) {
          missing.nearbyPlaces += 1;
          projectsMissingPoi += 1;
        }
        if (!project.priceRange?.min) missing.pricing += 1;
        if (!checklist.amenities) missing.amenities += 1;
        if (!checklist.configurations) missing.configurations += 1;

        if (!project.latitude || !project.longitude) missingCoordinates += 1;
        if (!checklist.seo) missingSeo += 1;
        if (!project.seoDescription?.trim()) missingMetaDescriptions += 1;
        if (!checklist.projectData) missingMandatoryFields += 1;

        if (checklist.gallery && checklist.floorPlans) mediaComplete += 1;
        if (checklist.nearbyPlaces) poiComplete += 1;

        rows.push({
          _id: projectId,
          slug: String(project.slug),
          projectName: String(project.projectName),
          builderName: String(project.builderName),
          locationName: project.locationName ? String(project.locationName) : undefined,
          locationId: project.location ? String(project.location) : undefined,
          checklist,
          completionPercent: percent,
          missingItems,
        });
      }

      const poiByType: Record<string, number> = {};
      for (const [, label] of Object.entries(POI_TYPE_LABELS)) {
        poiByType[label] = 0;
      }
      for (const row of poiByTypeRaw) {
        const label = POI_TYPE_LABELS[String(row._id)] ?? String(row._id);
        poiByType[label] = row.count;
      }

      const [publishedProjects, draftProjects, archivedProjects, importedCount] = counts;

      return {
        activeCount: publishedProjects,
        inactiveCount: draftProjects,
        archivedCount: archivedProjects,
        importedCount,
        rows,
        missing,
        projectsMissingPoi,
        poiByType,
        missingCoordinates,
        missingSeo,
        missingMetaDescriptions,
        missingMandatoryFields,
        brokenImages,
        invalidUrls,
        avgCompletionPercent: activeCount
          ? Math.round(completionSum / activeCount)
          : 0,
        mediaCompletePercent: activeCount
          ? Math.round((mediaComplete / activeCount) * 100)
          : 0,
        poiCompletePercent: activeCount
          ? Math.round((poiComplete / activeCount) * 100)
          : 0,
      };
    });
  },

  toProjectFactoryMetrics(
    snapshot: ProjectAnalyticsSnapshot
  ): ProjectFactoryMetrics {
    return {
      projectsImported: snapshot.importedCount,
      landingPagesGenerated: snapshot.activeCount,
      publishedProjects: snapshot.activeCount,
      draftProjects: snapshot.inactiveCount,
      archivedProjects: snapshot.archivedCount,
      missing: snapshot.missing,
    };
  },

  toLocationIntelligenceMetrics(
    snapshot: ProjectAnalyticsSnapshot
  ): LocationIntelligenceMetrics {
    return {
      byType: snapshot.poiByType,
      projectsMissingPoi: snapshot.projectsMissingPoi,
    };
  },

  toProjectCompletionScores(
    snapshot: ProjectAnalyticsSnapshot,
    limit = 24
  ): ProjectCompletionScore[] {
    return [...snapshot.rows]
      .sort((a, b) => a.completionPercent - b.completionPercent)
      .slice(0, limit)
      .map((row) => ({
        projectId: row._id,
        slug: row.slug,
        projectName: row.projectName,
        builderName: row.builderName,
        completionPercent: row.completionPercent,
        checklist: row.checklist,
        missingItems: row.missingItems,
        href: `/admin/projects/${row._id}/edit`,
      }));
  },
};
