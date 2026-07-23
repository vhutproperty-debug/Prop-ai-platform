import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardStatsCards } from "@/components/admin/dashboard-stats";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ProjectIntelligenceDashboardCard } from "@/components/admin/project-intelligence/project-intelligence-dashboard-card";
import { RecentActivity } from "@/components/admin/recent-activity";
import { isDbConfigured } from "@/config/env";
import { getSession } from "@/lib/auth/session";
import { dashboardService } from "@/services/admin/dashboard.service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const [stats, activity, session] = await Promise.all([
    dashboardService.getStats(),
    dashboardService.getRecentActivity(12),
    getSession(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your Prop AI catalog and leads pipeline."
      />
      <DashboardStatsCards stats={stats} />
      {session?.role === "admin" && <ProjectIntelligenceDashboardCard />}
      <Suspense fallback={null}>
        <RecentActivity items={activity} />
      </Suspense>
    </div>
  );
}
