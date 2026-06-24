import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardStatsCards } from "@/components/admin/dashboard-stats";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { RecentActivity } from "@/components/admin/recent-activity";
import { isDbConfigured } from "@/config/env";
import { dashboardService } from "@/services/admin/dashboard.service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const [stats, activity] = await Promise.all([
    dashboardService.getStats(),
    dashboardService.getRecentActivity(12),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your Prop AI catalog and leads pipeline."
      />
      <DashboardStatsCards stats={stats} />
      <Suspense fallback={null}>
        <RecentActivity items={activity} />
      </Suspense>
    </div>
  );
}
