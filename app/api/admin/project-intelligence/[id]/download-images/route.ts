import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { normalizeProjectIntelligenceReport } from "@/lib/project-intelligence/report-normalizer";
import { slugifyFilename } from "@/lib/project-intelligence/export-client";
import { projectIntelligenceExtractorService } from "@/services/project-intelligence/project-intelligence-extractor.service";
import { buildImagesZip } from "@/services/project-intelligence/media-download.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await context.params;
    const record = await projectIntelligenceExtractorService.getById(id);
    if (!record) return apiError(new Error("Record not found"));

    const report = normalizeProjectIntelligenceReport(record.report);
    if (!report.images.length) {
      return apiError(new Error("No images available"));
    }

    const buffer = await buildImagesZip(report.images);
    const base = slugifyFilename(report.project.projectName ?? "project-intelligence");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${base}-images.zip"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
