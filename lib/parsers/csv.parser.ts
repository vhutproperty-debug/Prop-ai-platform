/**
 * Parses CSV text into row objects.
 * Copyright-safe: only structured columnar factual data.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must contain a header row and at least one data row");
  }

  const headers = splitCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(
        `CSV row ${index + 2} has ${values.length} columns, expected ${headers.length}`
      );
    }
    return Object.fromEntries(headers.map((h, i) => [h, values[i].trim()]));
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function groupCsvRowsByProject(
  rows: Record<string, string>[]
): Map<string, Record<string, string>[]> {
  const groups = new Map<string, Record<string, string>[]>();

  for (const row of rows) {
    const key = [
      row.builder_name ?? "",
      row.project_name ?? "",
      row.location_name ?? "",
    ].join("::");
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  }

  return groups;
}
