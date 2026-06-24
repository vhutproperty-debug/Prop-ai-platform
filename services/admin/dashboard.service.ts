import { withDatabase } from "@/lib/db/with-database";
import { ImportJob } from "@/models/ImportJob";
import { Lead } from "@/models/Lead";
import { Project } from "@/models/Project";
import { Builder } from "@/models/Builder";

export interface DashboardStats {
  totalBuilders: number;
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  leadCount: number;
}

export interface ActivityItem {
  id: string;
  type: "lead" | "project" | "import";
  title: string;
  description: string;
  timestamp: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return withDatabase(async () => {
      const [
        totalBuilders,
        totalProjects,
        publishedProjects,
        draftProjects,
        leadCount,
      ] = await Promise.all([
        Builder.countDocuments({ isActive: true }),
        Project.countDocuments(),
        Project.countDocuments({ isActive: true }),
        Project.countDocuments({ isActive: false }),
        Lead.countDocuments(),
      ]);

      return {
        totalBuilders,
        totalProjects,
        publishedProjects,
        draftProjects,
        leadCount,
      };
    });
  },

  async getRecentActivity(limit = 10): Promise<ActivityItem[]> {
    return withDatabase(async () => {
      const [leads, projects, imports] = await Promise.all([
        Lead.find()
          .select("name status source createdAt")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Project.find()
          .select("projectName slug updatedAt isActive")
          .sort({ updatedAt: -1 })
          .limit(limit)
          .lean(),
        ImportJob.find()
          .select("source status recordCount createdAt")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
      ]);

      const activity: ActivityItem[] = [
        ...leads.map((lead) => ({
          id: String(lead._id),
          type: "lead" as const,
          title: `New lead: ${lead.name}`,
          description: `${lead.status} · ${lead.source}`,
          timestamp: new Date(lead.createdAt).toISOString(),
        })),
        ...projects.map((project) => ({
          id: String(project._id),
          type: "project" as const,
          title: project.projectName,
          description: project.isActive ? "Published" : "Draft",
          timestamp: new Date(project.updatedAt).toISOString(),
        })),
        ...imports.map((job) => ({
          id: String(job._id),
          type: "import" as const,
          title: `Import: ${job.source}`,
          description: `${job.status} · ${job.recordCount ?? 0} records`,
          timestamp: new Date(job.createdAt).toISOString(),
        })),
      ];

      return activity
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    });
  },
};
