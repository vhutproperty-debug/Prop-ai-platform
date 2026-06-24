import type { LeadScore, LeadSource, LeadStatus } from "@/config/constants";
import { LEAD_SCORES, LEAD_STATUSES } from "@/config/constants";
import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { KANBAN_STATUS_ORDER, LEAD_STATUS_LABELS } from "@/lib/leads/labels";
import { normalizeLeadSource } from "@/lib/leads/normalize";
import { toObjectIdString } from "@/lib/utils";
import { Lead as LeadModel } from "@/models/Lead";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { leadIntegrationsService } from "@/services/lead-integrations.service";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type {
  AgentOption,
  Lead,
  LeadActivity,
  LeadKanbanColumn,
  LeadListItem,
  LeadNote,
  LeadStats,
  PaginatedLeads,
} from "@/types/lead";
import type { PriceRange } from "@/types/models";
import type {
  AddLeadNoteInput,
  AssignLeadInput,
  CreateLeadInput,
  LeadBulkActionInput,
  LeadFilterInput,
  UpdateLeadInput,
} from "@/validations/lead";

const LIST_PROJECTION =
  "name phone email source status score configuration timeline purpose projectId projectSlug assignedTo assignedToName createdAt updatedAt";

interface ActorContext {
  actorId?: string;
  actorName?: string;
}

function mapListItem(doc: Record<string, unknown>): LeadListItem {
  return {
    _id: toObjectIdString(doc._id),
    name: String(doc.name),
    phone: String(doc.phone),
    email: String(doc.email),
    source: doc.source as LeadListItem["source"],
    status: doc.status as LeadStatus,
    score: doc.score as LeadScore,
    configuration: doc.configuration ? String(doc.configuration) : undefined,
    timeline: doc.timeline ? String(doc.timeline) : undefined,
    purpose: doc.purpose ? String(doc.purpose) : undefined,
    projectId: doc.projectId ? toObjectIdString(doc.projectId) : undefined,
    projectSlug: doc.projectSlug ? String(doc.projectSlug) : undefined,
    assignedTo: doc.assignedTo ? toObjectIdString(doc.assignedTo) : undefined,
    assignedToName: doc.assignedToName ? String(doc.assignedToName) : undefined,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as Date).toISOString(),
  };
}

function buildFilterQuery(filters: LeadFilterInput): Record<string, unknown> {
  const { search, status, source, score, assignedTo, unassigned, projectSlug } =
    filters;

  const query: Record<string, unknown> = {
    ...buildTextSearchQuery(search, [
      "name",
      "email",
      "phone",
      "configuration",
      "purpose",
      "projectSlug",
      "query",
    ]),
  };

  if (status) query.status = status;
  if (source) query.source = source;
  if (score) query.score = score;
  if (projectSlug) query.projectSlug = projectSlug;
  if (unassigned) query.assignedTo = { $exists: false };
  else if (assignedTo) query.assignedTo = assignedTo;

  return query;
}

async function resolveProjectSlug(projectId?: string) {
  if (!projectId) return undefined;
  const project = await Project.findById(projectId).select("slug").lean();
  return project?.slug ? String(project.slug) : undefined;
}

async function resolveAgentName(agentId?: string | null) {
  if (!agentId) return undefined;
  const user = await User.findById(agentId).select("name").lean();
  return user?.name ? String(user.name) : undefined;
}

function appendActivity(
  activities: LeadActivity[],
  activity: Omit<LeadActivity, "createdAt"> & { createdAt?: Date }
) {
  activities.push({
    ...activity,
    createdAt: activity.createdAt ?? new Date(),
  });
}

export const leadService = {
  async create(input: CreateLeadInput, actor?: ActorContext) {
    const { project, locality, ...rest } = input;
    const projectId = rest.projectId ?? project;
    const locationId = rest.locationId ?? locality;
    const projectSlug =
      rest.projectSlug ?? (projectId ? await resolveProjectSlug(projectId) : undefined);

    const payload = {
      ...rest,
      source: normalizeLeadSource(rest.source),
      projectId,
      locationId,
      projectSlug,
      status: rest.status ?? "new",
      score: rest.score ?? "warm",
      notes: rest.query
        ? [
            {
              content: rest.query,
              authorName: "System",
              createdAt: new Date(),
            },
          ]
        : [],
      activities: [
        {
          type: "created" as const,
          message: `Lead created from ${rest.source}`,
          actorId: actor?.actorId,
          actorName: actor?.actorName ?? "System",
          createdAt: new Date(),
        },
      ],
    };

    const lead = await withDatabase(() => LeadModel.create(payload));
    const mapped = this.mapLead(lead.toObject());

    void leadIntegrationsService.onLeadCreated(mapped);
    return lead;
  },

  async list(filters: LeadFilterInput): Promise<PaginatedLeads> {
    const { page, limit } = filters;
    const { skip } = getPagination(page, limit);
    const query = buildFilterQuery(filters);

    const [items, total] = await withDatabase(() =>
      Promise.all([
        LeadModel.find(query)
          .select(LIST_PROJECTION)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LeadModel.countDocuments(query),
      ])
    );

    return buildPaginatedResult(
      items.map((item) => mapListItem(item as Record<string, unknown>)),
      total,
      page,
      limit
    );
  },

  async getKanban(
    filters: Omit<LeadFilterInput, "page" | "limit">,
    perColumn = 30
  ): Promise<LeadKanbanColumn[]> {
    const query = buildFilterQuery({ ...filters, page: 1, limit: 1 });

    return withDatabase(async () => {
      const counts = await LeadModel.aggregate<{ _id: LeadStatus; count: number }>([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const countMap = Object.fromEntries(
        counts.map((c) => [c._id, c.count])
      ) as Record<string, number>;

      const columns = await Promise.all(
        KANBAN_STATUS_ORDER.map(async (status) => {
          const leads = await LeadModel.find({ ...query, status })
            .select(LIST_PROJECTION)
            .sort({ updatedAt: -1 })
            .limit(perColumn)
            .lean();

          return {
            status,
            label: LEAD_STATUS_LABELS[status],
            count: countMap[status] ?? 0,
            leads: leads.map((l) => mapListItem(l as Record<string, unknown>)),
          };
        })
      );

      return columns;
    });
  },

  async getStats(): Promise<LeadStats> {
    return withDatabase(async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [total, statusAgg, scoreAgg, sourceAgg, newToday, hotLeads, unassigned] =
        await Promise.all([
          LeadModel.countDocuments(),
          LeadModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
          LeadModel.aggregate([{ $group: { _id: "$score", count: { $sum: 1 } } }]),
          LeadModel.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]),
          LeadModel.countDocuments({ createdAt: { $gte: startOfDay } }),
          LeadModel.countDocuments({ score: "hot", status: { $nin: ["won", "lost"] } }),
          LeadModel.countDocuments({ assignedTo: { $exists: false } }),
        ]);

      const byStatus = Object.fromEntries(
        LEAD_STATUSES.map((s) => [s, 0])
      ) as Record<LeadStatus, number>;
      for (const row of statusAgg) byStatus[row._id as LeadStatus] = row.count;

      const byScore = Object.fromEntries(
        LEAD_SCORES.map((s) => [s, 0])
      ) as Record<LeadScore, number>;
      for (const row of scoreAgg) byScore[row._id as LeadScore] = row.count;

      const bySource: Record<string, number> = {};
      for (const row of sourceAgg) bySource[row._id] = row.count;

      return {
        total,
        byStatus,
        byScore,
        bySource,
        newToday,
        hotLeads,
        unassigned,
      };
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const lead = await LeadModel.findById(id).lean();
      if (!lead) throw new NotFoundError("Lead");
      return this.mapLead(lead as Record<string, unknown>);
    });
  },

  async update(input: UpdateLeadInput, actor?: ActorContext) {
    const { id, note, ...updates } = input;

    return withDatabase(async () => {
      const lead = await LeadModel.findById(id);
      if (!lead) throw new NotFoundError("Lead");

      const changes: string[] = [];

      if (updates.name) lead.name = updates.name;
      if (updates.email) lead.email = updates.email;
      if (updates.phone) lead.phone = updates.phone;
      if (updates.budget) lead.budget = updates.budget as never;
      if (updates.configuration !== undefined) {
        lead.configuration = updates.configuration;
      }
      if (updates.timeline !== undefined) lead.timeline = updates.timeline;
      if (updates.purpose !== undefined) lead.purpose = updates.purpose;
      if (updates.source) lead.source = updates.source;
      if (updates.projectId) {
        lead.projectId = updates.projectId as never;
        lead.projectSlug = await resolveProjectSlug(updates.projectId);
      }
      if (updates.projectSlug) lead.projectSlug = updates.projectSlug;

      if (updates.status && updates.status !== lead.status) {
        appendActivity(lead.activities, {
          type: "status_change",
          message: `Status changed from ${lead.status} to ${updates.status}`,
          actorId: actor?.actorId,
          actorName: actor?.actorName,
          meta: { from: lead.status, to: updates.status },
        });
        lead.status = updates.status;
        changes.push("status");
      }

      if (updates.score && updates.score !== lead.score) {
        appendActivity(lead.activities, {
          type: "score_change",
          message: `Score changed from ${lead.score} to ${updates.score}`,
          actorId: actor?.actorId,
          actorName: actor?.actorName,
          meta: { from: lead.score, to: updates.score },
        });
        lead.score = updates.score;
        changes.push("score");
      }

      if (updates.assignedTo !== undefined) {
        const agentName = await resolveAgentName(updates.assignedTo);
        appendActivity(lead.activities, {
          type: "assigned",
          message: updates.assignedTo
            ? `Assigned to ${agentName ?? updates.assignedTo}`
            : "Lead unassigned",
          actorId: actor?.actorId,
          actorName: actor?.actorName,
          meta: { assignedTo: updates.assignedTo, assignedToName: agentName },
        });
        lead.assignedTo = (updates.assignedTo ?? undefined) as never;
        lead.assignedToName = agentName;
        changes.push("assignment");
      }

      if (note) {
        lead.notes.push({
          content: note,
          authorId: actor?.actorId as never,
          authorName: actor?.actorName ?? "Agent",
          createdAt: new Date(),
        });
        appendActivity(lead.activities, {
          type: "note_added",
          message: "Note added",
          actorId: actor?.actorId,
          actorName: actor?.actorName,
        });
        changes.push("note");
      }

      if (changes.length && !changes.includes("status") && !changes.includes("score")) {
        appendActivity(lead.activities, {
          type: "updated",
          message: `Lead updated (${changes.join(", ")})`,
          actorId: actor?.actorId,
          actorName: actor?.actorName,
        });
      }

      await lead.save();
      const mapped = this.mapLead(lead.toObject());

      if (changes.length) {
        void leadIntegrationsService.onLeadUpdated(mapped, changes.join(", "));
      }

      return mapped;
    });
  },

  async addNote(input: AddLeadNoteInput, actor?: ActorContext) {
    return this.update(
      { id: input.leadId, note: input.content },
      actor
    );
  },

  async assign(input: AssignLeadInput, actor?: ActorContext) {
    return this.update(
      { id: input.leadId, assignedTo: input.assignedTo },
      actor
    );
  },

  async bulkAction(input: LeadBulkActionInput, actor?: ActorContext) {
    const { ids, action, assignedTo, status, score } = input;

    if (action === "delete") {
      const result = await withDatabase(() =>
        LeadModel.deleteMany({ _id: { $in: ids } })
      );
      return { modified: result.deletedCount };
    }

    if (action === "assign") {
      const results = await Promise.all(
        ids.map((id) =>
          this.update({ id, assignedTo: assignedTo ?? null }, actor)
        )
      );
      return { modified: results.length };
    }

    if (action === "set_status" && status) {
      const results = await Promise.all(
        ids.map((id) => this.update({ id, status }, actor))
      );
      return { modified: results.length };
    }

    if (action === "set_score" && score) {
      const results = await Promise.all(
        ids.map((id) => this.update({ id, score }, actor))
      );
      return { modified: results.length };
    }

    return { modified: 0 };
  },

  async remove(id: string) {
    const lead = await withDatabase(() => LeadModel.findByIdAndDelete(id).lean());
    if (!lead) throw new NotFoundError("Lead");
    return lead;
  },

  async listAgents(): Promise<AgentOption[]> {
    return withDatabase(async () => {
      const agents = await User.find({ role: { $in: ["admin", "agent"] } })
        .select("name email")
        .sort({ name: 1 })
        .lean();

      return agents.map((a) => ({
        _id: String(a._id),
        name: String(a.name),
        email: String(a.email),
      }));
    });
  },

  async exportCsv(filters: LeadFilterInput) {
    const query = buildFilterQuery(filters);
    const items = await withDatabase(() =>
      LeadModel.find(query)
        .select(
          "name email phone status score source configuration timeline purpose projectSlug budget assignedToName createdAt"
        )
        .sort({ createdAt: -1 })
        .limit(10000)
        .lean()
    );

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Status",
      "Score",
      "Source",
      "Configuration",
      "Timeline",
      "Purpose",
      "Project Slug",
      "Budget Min",
      "Budget Max",
      "Assigned To",
      "Created At",
    ];

    const rows = items.map((lead) =>
      [
        lead.name,
        lead.email,
        lead.phone,
        lead.status,
        lead.score,
        lead.source,
        lead.configuration ?? "",
        lead.timeline ?? "",
        lead.purpose ?? "",
        lead.projectSlug ?? "",
        lead.budget?.min ?? "",
        lead.budget?.max ?? "",
        lead.assignedToName ?? "",
        new Date(lead.createdAt).toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  },

  mapLead(doc: Record<string, unknown>): Lead {
    return {
      _id: toObjectIdString(doc._id),
      name: String(doc.name),
      phone: String(doc.phone),
      email: String(doc.email),
      budget: doc.budget as PriceRange | undefined,
      configuration: doc.configuration ? String(doc.configuration) : undefined,
      timeline: doc.timeline ? String(doc.timeline) : undefined,
      purpose: doc.purpose ? String(doc.purpose) : undefined,
      projectId: doc.projectId ? toObjectIdString(doc.projectId) : undefined,
      projectSlug: doc.projectSlug ? String(doc.projectSlug) : undefined,
      builderId: doc.builderId ? toObjectIdString(doc.builderId) : undefined,
      locationId: doc.locationId ? toObjectIdString(doc.locationId) : undefined,
      source: doc.source as LeadSource,
      status: doc.status as LeadStatus,
      score: doc.score as LeadScore,
      notes: (doc.notes as LeadNote[] | undefined) ?? [],
      activities: (doc.activities as LeadActivity[] | undefined) ?? [],
      assignedTo: doc.assignedTo ? toObjectIdString(doc.assignedTo) : undefined,
      assignedToName: doc.assignedToName ? String(doc.assignedToName) : undefined,
      query: doc.query ? String(doc.query) : undefined,
      integrations: doc.integrations as Lead["integrations"],
      createdAt: new Date(doc.createdAt as Date).toISOString(),
      updatedAt: new Date(doc.updatedAt as Date).toISOString(),
    };
  },
};
