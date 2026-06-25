import { notFound } from "next/navigation";
import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { DatabaseDashboard } from "@/components/admin/database/database-dashboard";
import { databaseAdminService } from "@/services/database/admin-dashboard.service";
import { crudVerificationService } from "@/services/database/crud-verification.service";
import { databaseHealthService } from "@/services/database/health.service";

export const dynamic = "force-dynamic";

export default async function AdminDatabasePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  if (!isDbConfigured) return <DbNotConfigured />;

  const [dashboard, health, crudResults] = await Promise.all([
    databaseAdminService.getDashboard(),
    databaseHealthService.check(),
    crudVerificationService.runAll(),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/dashboard" className="text-sm text-muted hover:text-foreground">
        ← Admin Dashboard
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Database</h1>
        <p className="mt-1 text-sm text-muted">
          MongoDB Atlas connection diagnostics (development only).
        </p>
      </div>
      <DatabaseDashboard
        dashboard={dashboard}
        health={health}
        crudResults={crudResults}
      />
    </div>
  );
}
