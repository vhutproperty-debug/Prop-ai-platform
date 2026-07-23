import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isFirecrawlConfigured } from "@/config/env";

export function ProjectIntelligenceDashboardCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanSearch className="h-4 w-4" />
          Project Intelligence Extractor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted">
          Paste a builder project URL to extract possession timeline, configurations, amenities,
          and marketing intelligence for internal use.
        </p>
        <p className="text-xs text-muted">
          Firecrawl: {isFirecrawlConfigured ? "configured" : "not configured"}
        </p>
        <Link
          href="/admin/project-intelligence"
          className="inline-flex rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/10"
        >
          Open Extractor
        </Link>
      </CardContent>
    </Card>
  );
}
