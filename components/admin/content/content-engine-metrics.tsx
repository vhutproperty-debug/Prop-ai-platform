import type { ContentDashboardMetrics } from "@/types/content-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const METRICS: Array<{ key: keyof ContentDashboardMetrics; label: string }> = [
  { key: "totalArticles", label: "Total Articles" },
  { key: "drafts", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "aiGenerated", label: "AI Generated" },
  { key: "humanEdited", label: "Human Edited" },
  { key: "projectCoverage", label: "Project Coverage" },
  { key: "builderCoverage", label: "Builder Coverage" },
  { key: "localityCoverage", label: "Locality Coverage" },
  { key: "seoHealth", label: "SEO Health %" },
  { key: "publishingQueue", label: "Publishing Queue" },
];

export function ContentEngineMetrics({ metrics }: { metrics: ContentDashboardMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {METRICS.map(({ key, label }) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {typeof metrics[key] === "number"
                ? (metrics[key] as number).toLocaleString("en-IN")
                : metrics[key] === null
                  ? "—"
                  : String(metrics[key])}
            </p>
          </CardContent>
        </Card>
      ))}
      {metrics.lastPublished && (
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Last Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {new Date(metrics.lastPublished).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
