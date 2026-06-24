import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadStats } from "@/types/lead";

export function LeadStatsCards({ stats }: { stats: LeadStats }) {
  const items = [
    { label: "Total Leads", value: stats.total },
    { label: "New Today", value: stats.newToday },
    { label: "Hot Leads", value: stats.hotLeads },
    { label: "Unassigned", value: stats.unassigned },
    { label: "Won", value: stats.byStatus.won },
    { label: "In Pipeline", value: stats.total - stats.byStatus.won - stats.byStatus.lost },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {item.value.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
