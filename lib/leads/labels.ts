import type { LeadScore, LeadSource, LeadStatus } from "@/config/constants";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit: "Site Visit",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  homepage: "Homepage",
  project_page: "Project Page",
  ai_assistant: "AI Assistant",
  whatsapp: "WhatsApp",
  manual: "Manual",
  referral: "Referral",
};

export const LEAD_SCORE_LABELS: Record<LeadScore, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

export const KANBAN_STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "site_visit",
  "negotiation",
  "won",
  "lost",
];

export function getScoreBadgeClass(score: LeadScore): string {
  if (score === "hot") return "bg-red-500/10 text-red-700";
  if (score === "warm") return "bg-amber-500/10 text-amber-700";
  return "bg-sky-500/10 text-sky-700";
}
