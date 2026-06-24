import type { Extractor, ExtractorContext } from "@/lib/extractors/types";
import { parseCsv } from "@/lib/parsers/csv.parser";
import { csvImportRowSchema } from "@/validations/ingestion";

export const csvExtractor: Extractor = {
  source: "csv",

  async extract(ctx: ExtractorContext) {
    ctx.logger.info("Extracting CSV import data", { fileName: ctx.fileName });

    let rows: Record<string, string>[];

    if (typeof ctx.payload === "string") {
      rows = parseCsv(ctx.payload);
    } else if (Array.isArray(ctx.payload)) {
      rows = ctx.payload as Record<string, string>[];
    } else {
      throw new Error("CSV payload must be a string or array of rows");
    }

    const validatedRows = rows.map((row, i) => {
      try {
        return csvImportRowSchema.parse(row);
      } catch (error) {
        throw new Error(
          `CSV row ${i + 1} validation failed: ${error instanceof Error ? error.message : "Invalid row"}`
        );
      }
    });

    const groups = new Map<string, typeof validatedRows>();
    for (const row of validatedRows) {
      const key = `${row.builder_name}::${row.project_name}::${row.location_name}`;
      const existing = groups.get(key) ?? [];
      existing.push(row);
      groups.set(key, existing);
    }

    ctx.logger.info("CSV parsed successfully", {
      rowCount: validatedRows.length,
      projectGroups: groups.size,
    });

    return {
      source: this.source,
      raw: { rows: validatedRows, groups: Object.fromEntries(groups) },
      logs: ctx.logger.getLogs(),
    };
  },
};
