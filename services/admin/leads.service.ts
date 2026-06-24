import { leadService } from "@/services/lead.service";

export const adminLeadService = {
  list: leadService.list.bind(leadService),
  getById: leadService.getById.bind(leadService),
  update: leadService.update.bind(leadService),
  remove: leadService.remove.bind(leadService),
  exportCsv: leadService.exportCsv.bind(leadService),

  async bulkAction(
    ids: string[],
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) {
    if (action === "delete") {
      const results = await Promise.all(ids.map((id) => leadService.remove(id)));
      return { modified: results.length };
    }
    return { modified: 0 };
  },
};
