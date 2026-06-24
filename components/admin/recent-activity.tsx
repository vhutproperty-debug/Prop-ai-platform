import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/services/admin/dashboard.service";

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex gap-4 py-4">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
                <time className="shrink-0 text-xs text-muted">
                  {new Date(item.timestamp).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No recent activity yet.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/admin/leads" className="text-accent hover:underline">
            View leads
          </Link>
          <Link href="/admin/projects" className="text-accent hover:underline">
            View projects
          </Link>
          <Link href="/admin/imports" className="text-accent hover:underline">
            View imports
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
