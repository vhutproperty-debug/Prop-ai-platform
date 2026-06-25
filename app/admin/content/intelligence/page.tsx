import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ContentIntelligencePanel } from "@/components/admin/content/content-intelligence-panel";
import { contentIntelligenceService } from "@/services/content-engine/intelligence/content-intelligence.service";

export const dynamic = "force-dynamic";

export default async function ContentIntelligencePage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const data = await contentIntelligenceService.getDashboard();

  return (
    <div className="space-y-6">
      <Link href="/admin/content" className="text-sm text-muted hover:text-foreground">
        ← Content Engine
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content Intelligence</h1>
        <p className="mt-1 text-sm text-muted">
          Research insights, content opportunities, editorial calendar, and performance signals.
        </p>
      </div>
      <ContentIntelligencePanel data={data} />
    </div>
  );
}
