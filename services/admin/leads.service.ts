import { leadService } from "@/services/lead.service";

export const adminLeadService = {
  list: leadService.list.bind(leadService),
  getById: leadService.getById.bind(leadService),
  update: leadService.update.bind(leadService),
  create: leadService.create.bind(leadService),
  addNote: leadService.addNote.bind(leadService),
  assign: leadService.assign.bind(leadService),
  remove: leadService.remove.bind(leadService),
  exportCsv: leadService.exportCsv.bind(leadService),
  getStats: leadService.getStats.bind(leadService),
  getKanban: leadService.getKanban.bind(leadService),
  listAgents: leadService.listAgents.bind(leadService),
  bulkAction: leadService.bulkAction.bind(leadService),
};
