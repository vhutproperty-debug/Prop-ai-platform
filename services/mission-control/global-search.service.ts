import { withDatabase } from "@/lib/db/with-database";
import { Builder } from "@/models/Builder";
import { Project } from "@/models/Project";
import { Location } from "@/models/Location";
import { ContentArticle } from "@/models/ContentArticle";
import { Lead } from "@/models/Lead";
import { User } from "@/models/User";
import type { MissionControlSearchResult } from "@/types/mission-control";

export const missionControlSearchService = {
  async search(query: string, limit = 12): Promise<MissionControlSearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    return withDatabase(async () => {
      const [builders, projects, articles, localities, leads, users] =
        await Promise.all([
          Builder.find({ $or: [{ name: regex }, { slug: regex }] })
            .select("name slug")
            .limit(limit)
            .lean(),
          Project.find({
            $or: [
              { projectName: regex },
              { slug: regex },
              { builderName: regex },
            ],
          })
            .select("projectName slug builderName")
            .limit(limit)
            .lean(),
          ContentArticle.find({ $or: [{ title: regex }, { slug: regex }] })
            .select("title slug contentType status")
            .limit(limit)
            .lean(),
          Location.find({ $or: [{ name: regex }, { slug: regex }] })
            .select("name slug city")
            .limit(limit)
            .lean(),
          Lead.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] })
            .select("name email status projectName")
            .limit(limit)
            .lean(),
          User.find({ $or: [{ name: regex }, { email: regex }] })
            .select("name email role")
            .limit(limit)
            .lean(),
        ]);

      const results: MissionControlSearchResult[] = [
        ...builders.map((b) => ({
          type: "builder" as const,
          id: String(b._id),
          title: String(b.name),
          subtitle: String(b.slug),
          href: `/admin/builders/${b._id}/edit`,
        })),
        ...projects.map((p) => ({
          type: "project" as const,
          id: String(p._id),
          title: String(p.projectName),
          subtitle: String(p.builderName),
          href: `/admin/projects/${p._id}/edit`,
        })),
        ...articles.map((a) => ({
          type: "article" as const,
          id: String(a._id),
          title: String(a.title),
          subtitle: String(a.contentType),
          href: `/admin/content/articles/${a._id}`,
        })),
        ...localities.map((l) => ({
          type: "locality" as const,
          id: String(l._id),
          title: String(l.name),
          subtitle: String(l.city),
          href: `/localities/${l.slug}`,
        })),
        ...leads.map((l) => ({
          type: "lead" as const,
          id: String(l._id),
          title: String(l.name),
          subtitle: String(l.email ?? l.status),
          href: `/admin/leads/${l._id}`,
        })),
        ...users.map((u) => ({
          type: "user" as const,
          id: String(u._id),
          title: String(u.name),
          subtitle: String(u.email),
          href: "/admin/settings",
        })),
      ];

      return results.slice(0, limit);
    });
  },
};
