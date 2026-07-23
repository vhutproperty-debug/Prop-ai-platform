import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProjectIntelligenceExtractor } from "@/components/admin/project-intelligence/project-intelligence-extractor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isFirecrawlConfigured } from "@/config/env";

export const dynamic = "force-dynamic";

export default function ProjectIntelligencePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Project Intelligence"
        description="Internal tool to extract structured builder project intelligence from public URLs."
      />

      {!isFirecrawlConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Firecrawl not configured</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Set <code className="rounded bg-muted/10 px-1">FIRECRAWL_API_KEY</code> in{" "}
            <code className="rounded bg-muted/10 px-1">.env.local</code> to enable extraction.
          </CardContent>
        </Card>
      )}

      <ProjectIntelligenceExtractor />

      <p className="text-xs text-muted">
        Saved reports are stored in the{" "}
        <code className="rounded bg-muted/10 px-1">project_intelligence</code> collection only.
        This tool does not modify published projects or the import pipeline.
      </p>
    </div>
  );
}
