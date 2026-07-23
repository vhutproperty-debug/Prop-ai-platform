import * as XLSX from "xlsx";
import { normalizeProjectIntelligenceReport } from "@/lib/project-intelligence/report-normalizer";
import type { ProjectIntelligenceReport } from "@/types/project-intelligence";

function sheetFromRows(name: string, rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ note: "No data extracted" }]);
  return { name, ws };
}

export function exportProjectIntelligenceJson(report: ProjectIntelligenceReport): Blob {
  return new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
}

export function exportProjectIntelligenceExcel(report: ProjectIntelligenceReport): Blob {
  const normalized = normalizeProjectIntelligenceReport(report);
  const wb = XLSX.utils.book_new();

  const sheets = [
    sheetFromRows("01 Project Summary", [
      {
        projectName: report.project.projectName,
        builder: report.project.builder,
        address: report.project.address,
        microLocation: report.project.microLocation,
        city: report.project.city,
        state: report.project.state,
        latitude: report.project.latitude,
        longitude: report.project.longitude,
        reraNumber: report.project.reraNumber,
        projectStatus: report.project.projectStatus,
        launchDate: report.project.launchDate,
        expectedPossession: report.project.expectedPossession,
        revisedPossession: report.project.revisedPossession,
        currentPhase: report.project.currentPhase,
        constructionStage: report.project.constructionStage,
        towerCount: report.project.towerCount,
        floorCount: report.project.floorCount,
        unitCount: report.project.unitCount,
        sourceUrl: report.meta.sourceUrl,
        extractedAt: report.meta.extractedAt,
        confidence: report.meta.extractionConfidence,
      },
    ]),
    sheetFromRows("02 Possession Intelligence", [
      {
        expectedPossession: report.possession.expectedPossession,
        revisedPossession: report.possession.revisedPossession,
        ocStatus: report.possession.ocStatus,
        ccStatus: report.possession.ccStatus,
        constructionCompletionPercent: report.possession.constructionCompletionPercent,
        aiEstimatedMarketingStartDate: report.possession.aiEstimatedMarketingStartDate,
        aiConfidenceScore: report.possession.aiConfidenceScore,
      },
      ...report.possession.towerWisePossession.map((t) => ({
        tower: t.tower,
        possession: t.possession,
      })),
      ...report.possession.phaseWisePossession.map((p) => ({
        phase: p.phase,
        possession: p.possession,
      })),
    ]),
    sheetFromRows(
      "03 Configurations",
      report.configurations.map((c) => ({
        configuration: c.configuration,
        carpetArea: c.carpetArea,
        balcony: c.balcony,
        deck: c.deck,
        parking: c.parking,
        facing: c.facing,
        vastu: c.vastu,
        priceRange: c.priceRange,
        sourceUrl: c.sourceUrl,
      }))
    ),
    sheetFromRows(
      "04 Amenities",
      report.amenities.map((a) => ({ amenity: a }))
    ),
    sheetFromRows(
      "05 Specifications",
      report.specifications.flatMap((s) =>
        s.details.map((d) => ({ category: s.category, detail: d, sourceUrl: s.sourceUrl }))
      )
    ),
    sheetFromRows(
      "06 Images",
      normalized.images.length
        ? normalized.images.map((m) => ({
            type: m.type,
            filename: m.filename,
            url: m.url,
            source: m.source,
          }))
        : report.media.map((m) => ({
            type: m.type,
            url: m.url,
            label: m.label,
            sourceUrl: m.sourceUrl,
          }))
    ),
    sheetFromRows(
      "07 Floor Plans",
      normalized.floorPlans.length
        ? normalized.floorPlans.map((m) => ({
            type: m.type,
            filename: m.filename,
            url: m.url,
            source: m.source,
          }))
        : report.media
            .filter((m) => m.type === "floor_plan" || m.type === "master_plan")
            .map((m) => ({ type: m.type, url: m.url, sourceUrl: m.sourceUrl }))
    ),
    sheetFromRows("08 Downloads", [
      ...report.downloads.map((d) => ({
        label: d.label,
        type: d.type,
        url: d.url,
      })),
      ...normalized.brochures.map((b) => ({
        label: b.filename,
        type: "brochure",
        url: b.url,
      })),
    ]),
    sheetFromRows("09 AI Summary", [
      { section: "Project Overview", content: report.aiSummary.projectOverview },
      ...report.aiSummary.keyHighlights.map((h, i) => ({
        section: `Highlight ${i + 1}`,
        content: h,
      })),
      { section: "Possession Status", content: report.aiSummary.possessionStatus },
      { section: "Marketing Readiness", content: report.aiSummary.marketingReadiness },
      {
        section: "Recommended Owner Marketing Timeline",
        content: report.aiSummary.recommendedOwnerMarketingTimeline,
      },
      ...report.aiSummary.importantMissingInformation.map((m, i) => ({
        section: `Missing ${i + 1}`,
        content: m,
      })),
      {
        section: "Confidence Score",
        content: String(report.aiSummary.confidenceScore),
      },
    ]),
  ];

  for (const { name, ws } of sheets) {
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openProjectIntelligencePdf(report: ProjectIntelligenceReport): void {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.project.projectName ?? "Project Intelligence")}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; line-height: 1.5; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    ul { margin: 8px 0; padding-left: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.project.projectName ?? "Project Intelligence Report")}</h1>
  <div class="meta">
    ${escapeHtml(report.project.builder ?? "")} · ${escapeHtml(report.meta.canonicalUrl)}<br/>
    Extracted ${escapeHtml(new Date(report.meta.extractedAt).toLocaleString("en-IN"))} ·
    ${report.meta.pagesCrawled} pages · Confidence ${Math.round(report.meta.extractionConfidence * 100)}%
  </div>

  <h2>Project Summary</h2>
  <table>
    <tr><th>Field</th><th>Value</th></tr>
    ${[
      ["RERA", report.project.reraNumber],
      ["Location", [report.project.microLocation, report.project.city, report.project.state].filter(Boolean).join(", ")],
      ["Status", report.project.projectStatus],
      ["Expected Possession", report.project.expectedPossession],
      ["Revised Possession", report.project.revisedPossession],
      ["Towers / Floors / Units", [report.project.towerCount, report.project.floorCount, report.project.unitCount].filter(Boolean).join(" / ")],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td>${escapeHtml(String(k))}</td><td>${escapeHtml(String(v))}</td></tr>`)
      .join("")}
  </table>

  <h2>Possession Intelligence</h2>
  <p>${escapeHtml(report.aiSummary.possessionStatus)}</p>
  ${
    report.possession.constructionCompletionPercent
      ? `<p>Construction completion: ${report.possession.constructionCompletionPercent}%</p>`
      : ""
  }

  <h2>Configurations (${report.configurations.length})</h2>
  <ul>${report.configurations.map((c) => `<li>${escapeHtml(c.configuration)}${c.carpetArea ? ` — ${escapeHtml(c.carpetArea)}` : ""}</li>`).join("")}</ul>

  <h2>Amenities (${report.amenities.length})</h2>
  <ul>${report.amenities.slice(0, 40).map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>

  <h2>AI Summary</h2>
  <p><strong>Overview:</strong> ${escapeHtml(report.aiSummary.projectOverview || "—")}</p>
  <p><strong>Marketing readiness:</strong> ${escapeHtml(report.aiSummary.marketingReadiness)}</p>
  <p><strong>Recommended timeline:</strong> ${escapeHtml(report.aiSummary.recommendedOwnerMarketingTimeline)}</p>
  ${
    report.aiSummary.importantMissingInformation.length
      ? `<p><strong>Missing:</strong> ${escapeHtml(report.aiSummary.importantMissingInformation.join("; "))}</p>`
      : ""
  }
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function slugifyFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
