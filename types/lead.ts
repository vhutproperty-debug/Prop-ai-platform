import type {
  LeadScore,
  LeadSource,
  LeadStatus,
} from "@/config/constants";
import type { PriceRange } from "@/types/models";

export type LeadActivityType =
  | "created"
  | "updated"
  | "status_change"
  | "score_change"
  | "note_added"
  | "assigned"
  | "integration";

export interface LeadNote {
  _id?: string;
  content: string;
  authorId?: string;
  authorName?: string;
  createdAt: Date | string;
}

export interface LeadActivity {
  _id?: string;
  type: LeadActivityType;
  message: string;
  actorId?: string;
  actorName?: string;
  meta?: Record<string, unknown>;
  createdAt: Date | string;
}

export interface LeadIntegrations {
  hubspot?: {
    contactId?: string;
    dealId?: string;
    syncedAt?: Date | string;
  };
  whatsapp?: {
    conversationId?: string;
    lastMessageAt?: Date | string;
  };
  meta?: {
    eventId?: string;
    pixelId?: string;
    sentAt?: Date | string;
  };
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  email: string;
  budget?: PriceRange;
  configuration?: string;
  timeline?: string;
  purpose?: string;
  projectId?: string;
  projectSlug?: string;
  builderId?: string;
  locationId?: string;
  source: LeadSource;
  status: LeadStatus;
  score: LeadScore;
  notes: LeadNote[];
  activities: LeadActivity[];
  assignedTo?: string;
  assignedToName?: string;
  query?: string;
  integrations?: LeadIntegrations;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LeadListItem {
  _id: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  score: LeadScore;
  configuration?: string;
  timeline?: string;
  purpose?: string;
  projectId?: string;
  projectSlug?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadKanbanColumn {
  status: LeadStatus;
  label: string;
  count: number;
  leads: LeadListItem[];
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byScore: Record<LeadScore, number>;
  bySource: Record<string, number>;
  newToday: number;
  hotLeads: number;
  unassigned: number;
}

export interface PaginatedLeads {
  items: LeadListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AgentOption {
  _id: string;
  name: string;
  email: string;
}
