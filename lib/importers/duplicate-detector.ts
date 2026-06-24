import type { DuplicateMatch } from "@/types/ingestion";
import type { NormalizedImportBundle } from "@/types/ingestion";
import { withDatabase } from "@/lib/db/with-database";
import { Builder } from "@/models/Builder";
import { Project } from "@/models/Project";
import { ImportRecord } from "@/models/ImportRecord";

export async function detectDuplicates(
  bundle: NormalizedImportBundle
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const { project, builder } = bundle;

  await withDatabase(async () => {
    const [existingBySlug, existingByRera, existingByPair, stagedBySlug] =
      await Promise.all([
        Project.findOne({ slug: project.slug }).select("_id slug projectName").lean(),
        project.reraNumber
          ? Project.findOne({ reraNumber: project.reraNumber }).select("_id slug reraNumber").lean()
          : null,
        Project.findOne({
          builderName: project.builderName,
          projectName: project.projectName,
        })
          .select("_id slug")
          .lean(),
        ImportRecord.findOne({
          slug: project.slug,
          status: { $in: ["staged", "approved"] },
        })
          .select("_id slug")
          .lean(),
      ]);

    if (existingBySlug) {
      matches.push({
        type: "exact_slug",
        entityType: "project",
        existingId: String(existingBySlug._id),
        existingSlug: existingBySlug.slug,
        confidence: 1,
        message: `Project slug "${project.slug}" already exists as "${existingBySlug.projectName}"`,
      });
    }

    if (existingByRera && String(existingByRera._id) !== String(existingBySlug?._id)) {
      matches.push({
        type: "rera_number",
        entityType: "project",
        existingId: String(existingByRera._id),
        existingSlug: existingByRera.slug,
        confidence: 0.95,
        message: `RERA number "${project.reraNumber}" already registered`,
      });
    }

    if (
      existingByPair &&
      String(existingByPair._id) !== String(existingBySlug?._id)
    ) {
      matches.push({
        type: "builder_project_pair",
        entityType: "project",
        existingId: String(existingByPair._id),
        existingSlug: existingByPair.slug,
        confidence: 0.9,
        message: `Project "${project.projectName}" by "${project.builderName}" may already exist`,
      });
    }

    if (stagedBySlug) {
      matches.push({
        type: "exact_slug",
        entityType: "project",
        existingId: String(stagedBySlug._id),
        existingSlug: stagedBySlug.slug,
        confidence: 0.85,
        message: `Import record with slug "${project.slug}" is already staged for review`,
      });
    }

    if (builder) {
      const existingBuilder = await Builder.findOne({ slug: builder.slug })
        .select("_id slug name")
        .lean();

      if (existingBuilder && !matches.some((m) => m.type === "exact_slug")) {
        matches.push({
          type: "fuzzy_name",
          entityType: "builder",
          existingId: String(existingBuilder._id),
          existingSlug: existingBuilder.slug,
          confidence: 0.8,
          message: `Builder "${builder.name}" already exists`,
        });
      }
    }
  });

  return matches;
}

export function hasBlockingDuplicate(matches: DuplicateMatch[]): boolean {
  return matches.some(
    (m) => m.type === "exact_slug" || m.type === "rera_number"
  );
}
