import type { IntelligenceDashboardData } from "@/types/content-research";
import { CONTENT_TYPE_LABELS } from "@/config/content-engine";
import type { ContentType } from "@/config/content-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ContentIntelligencePanel({ data }: { data: IntelligenceDashboardData }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted">Knowledge Packs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.researchStats.knowledgePacksTotal.toLocaleString("en-IN")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted">Low-Confidence Facts</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.researchStats.lowConfidenceFacts.toLocaleString("en-IN")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted">Articles Needing Refresh</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.researchStats.articlesNeedingRefresh.toLocaleString("en-IN")}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.opportunities.length === 0 ? (
            <p className="text-sm text-muted">No gaps detected.</p>
          ) : (
            data.opportunities.map((opp, i) => (
              <div
                key={i}
                className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{opp.title}</p>
                  <p className="text-sm text-muted">{opp.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">P{opp.priority}</Badge>
                  <Badge variant="outline">
                    {CONTENT_TYPE_LABELS[opp.suggestedContentType as ContentType]}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editorial Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.editorialCalendar.map((rec, i) => (
            <div key={i} className="border-b border-border pb-3 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{rec.title}</p>
                <Badge variant="outline">{rec.type.replace(/_/g, " ")}</Badge>
                <span className="text-xs text-muted">{rec.suggestedDate}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{rec.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Freshness Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.freshnessAlerts.length === 0 ? (
              <p className="text-muted">All published articles are current.</p>
            ) : (
              data.freshnessAlerts.map((a) => (
                <div key={a.articleId}>
                  <p className="font-medium">{a.articleSlug}</p>
                  <p className="text-muted">{a.refreshReason}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.performanceHighlights.length === 0 ? (
              <p className="text-muted">Sync performance after publishing articles.</p>
            ) : (
              data.performanceHighlights.map((p) => (
                <div key={p.articleId} className="flex justify-between">
                  <span>{p.articleSlug}</span>
                  <span className="text-muted">
                    {p.leadsGenerated} leads · decay {p.contentDecayScore}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {data.duplicateAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Duplicate Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.duplicateAlerts.map((d, i) => (
              <p key={i}>
                [{d.type}] {d.message} — <span className="text-muted">{d.suggestion}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
