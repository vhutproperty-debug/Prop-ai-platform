import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/services/admin/dashboard.service";

const STAT_ITEMS = [
  { key: "totalBuilders", label: "Total Builders" },
  { key: "totalProjects", label: "Total Projects" },
  { key: "publishedProjects", label: "Published Projects" },
  { key: "draftProjects", label: "Draft Projects" },
  { key: "leadCount", label: "Total Leads" },
] as const;

export function DashboardStatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {STAT_ITEMS.map((item) => (
        <Card key={item.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {stats[item.key].toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
