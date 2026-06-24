import type { ImportJobMetrics } from "@/types/firecrawl-import";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const METRIC_LABELS: Array<{ key: keyof ImportJobMetrics; label: string }> = [
  { key: "totalBuilders", label: "Total Builders" },
  { key: "totalProjects", label: "Total Projects" },
  { key: "importJobs", label: "Import Jobs" },
  { key: "projectsImported", label: "Projects Imported" },
  { key: "projectsUpdated", label: "Projects Updated" },
  { key: "duplicates", label: "Duplicates" },
  { key: "failures", label: "Failures" },
  { key: "pendingReviews", label: "Pending Reviews" },
];

export function ImportMetrics({ metrics }: { metrics: ImportJobMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {METRIC_LABELS.map(({ key, label }) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {metrics[key].toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
