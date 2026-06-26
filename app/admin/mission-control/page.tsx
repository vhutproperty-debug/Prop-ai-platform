import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { MissionControlDashboard } from "@/components/admin/mission-control/mission-control-dashboard";
import { isDbConfigured } from "@/config/env";

export const dynamic = "force-dynamic";

export default function MissionControlPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  return <MissionControlDashboard />;
}
