import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { Lead } from "@/models/Lead";
import type {
  CreateLeadInput,
  LeadFilterInput,
  UpdateLeadInput,
} from "@/validations/lead";
import { crmService } from "@/services/crm.service";

export const leadService = {
  async create(input: CreateLeadInput) {
    const { project, locality, ...rest } = input;
    const payload = {
      ...rest,
      projectId: rest.projectId ?? project,
      locationId: rest.locationId ?? locality,
    };

    const lead = await withDatabase(() => Lead.create(payload));
    await crmService.notifyNewLead(lead);
    return lead;
  },

  async list(filters: LeadFilterInput) {
    const { page, limit, status, search } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await withDatabase(() =>
      Promise.all([
        Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Lead.countDocuments(query),
      ])
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string) {
    const lead = await withDatabase(() => Lead.findById(id).lean());
    if (!lead) throw new NotFoundError("Lead");
    return lead;
  },

  async update(input: UpdateLeadInput) {
    const { id, notes, ...updates } = input;

    return withDatabase(async () => {
      const lead = await Lead.findById(id);
      if (!lead) throw new NotFoundError("Lead");

      if (updates.status) lead.status = updates.status;
      if (updates.assignedTo) lead.assignedTo = updates.assignedTo as never;
      if (notes) lead.notes.push(notes);

      await lead.save();
      return lead.toObject();
    });
  },

  async remove(id: string) {
    const lead = await withDatabase(() => Lead.findByIdAndDelete(id).lean());
    if (!lead) throw new NotFoundError("Lead");
    return lead;
  },

  async exportCsv(filters: Pick<LeadFilterInput, "status" | "search">) {
    const { items } = await this.list({ ...filters, page: 1, limit: 1000 });
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Status",
      "Source",
      "Query",
      "Created At",
    ];

    const rows = items.map((lead) =>
      [
        lead.name,
        lead.email,
        lead.phone,
        lead.status,
        lead.source,
        lead.query ?? "",
        new Date(lead.createdAt).toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  },
};
