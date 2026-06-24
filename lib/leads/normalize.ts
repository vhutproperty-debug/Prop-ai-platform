import type { LeadSource } from "@/config/constants";

const SOURCE_ALIASES: Record<string, LeadSource> = {
  website: "homepage",
  "project-page": "project_page",
  "ai-search": "ai_assistant",
  "locality-page": "homepage",
  partner: "manual",
};

export function normalizeLeadSource(source: string): LeadSource {
  const normalized = source.toLowerCase().trim();
  if (SOURCE_ALIASES[normalized]) return SOURCE_ALIASES[normalized];
  return normalized as LeadSource;
}

const STATUS_ALIASES: Record<string, string> = {
  NEW: "new",
  CONTACTED: "contacted",
  SITE_VISIT: "site_visit",
  QUOTATION_SENT: "qualified",
  NEGOTIATION: "negotiation",
  WON: "won",
  LOST: "lost",
};

export function normalizeLeadStatus(status: string): string {
  return STATUS_ALIASES[status] ?? status.toLowerCase();
}
