import {
  builders,
  featuredProjects,
  localities,
  searchSuggestions,
} from "@/data/homepage";
import { tryDatabase, withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { Builder } from "@/models/Builder";
import { Locality } from "@/models/Locality";
import { Project } from "@/models/Project";
import type { CreateProjectInput, ProjectFilterInput } from "@/validations/project";

export const projectService = {
  async list(filters: ProjectFilterInput) {
    const { page, limit, featured, status, locality, builder } = filters;
    const skip = (page - 1) * limit;

    const dbResult = await tryDatabase(async () => {
      const query: Record<string, unknown> = {};
      if (featured !== undefined) query.featured = featured;
      if (status) query.status = status;
      if (locality) {
        query.$or = [
          { locationName: new RegExp(locality, "i") },
          { microMarket: new RegExp(locality, "i") },
        ];
      }
      if (builder) query.builderName = new RegExp(builder, "i");

      const [items, total] = await Promise.all([
        Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Project.countDocuments(query),
      ]);

      if (!items.length) return null;
      return { items, total, source: "database" as const };
    });

    if (dbResult) {
      return {
        ...dbResult,
        page,
        limit,
        totalPages: Math.ceil(dbResult.total / limit),
      };
    }

    let items = [...featuredProjects];
    if (featured) items = items.filter((p) => p.featured);
    if (status) items = items.filter((p) => p.status === status);
    if (locality) {
      items = items.filter((p) =>
        p.locality.toLowerCase().includes(locality.toLowerCase())
      );
    }
    if (builder) {
      items = items.filter((p) =>
        p.builder.toLowerCase().includes(builder.toLowerCase())
      );
    }

    const total = items.length;
    return {
      items: items.slice(skip, skip + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      source: "static" as const,
    };
  },

  async getBySlug(slug: string) {
    const dbProject = await tryDatabase(() => Project.findOne({ slug }).lean());
    if (dbProject) return { data: dbProject, source: "database" as const };

    const project = featuredProjects.find((p) => p.slug === slug);
    if (!project) throw new NotFoundError("Project");
    return { data: project, source: "static" as const };
  },

  async create(input: CreateProjectInput) {
    return withDatabase(() => Project.create(input));
  },
};

export const builderService = {
  async list() {
    const dbBuilders = await tryDatabase(async () => {
      const items = await Builder.find().sort({ rating: -1 }).lean();
      return items.length ? items : null;
    });

    if (dbBuilders) return { items: dbBuilders, source: "database" as const };
    return { items: builders, source: "static" as const };
  },

  async getBySlug(slug: string) {
    const dbBuilder = await tryDatabase(() => Builder.findOne({ slug }).lean());
    if (dbBuilder) return { data: dbBuilder, source: "database" as const };

    const item = builders.find((b) => b.slug === slug);
    if (!item) throw new NotFoundError("Builder");
    return { data: item, source: "static" as const };
  },
};

export const localityService = {
  async list() {
    const dbLocalities = await tryDatabase(async () => {
      const items = await Locality.find().sort({ name: 1 }).lean();
      return items.length ? items : null;
    });

    if (dbLocalities) return { items: dbLocalities, source: "database" as const };
    return { items: localities, source: "static" as const };
  },

  async getBySlug(slug: string) {
    const dbLocality = await tryDatabase(() => Locality.findOne({ slug }).lean());
    if (dbLocality) return { data: dbLocality, source: "database" as const };

    const item = localities.find((l) => l.slug === slug);
    if (!item) throw new NotFoundError("Locality");
    return { data: item, source: "static" as const };
  },
};

export const searchService = {
  keywordSearch(query: string, limit = 5) {
    const normalized = query.toLowerCase();
    return searchSuggestions
      .filter((s) => s.text.toLowerCase().includes(normalized))
      .slice(0, limit);
  },

  async hybridSearch(query: string, limit = 5) {
    const suggestions = this.keywordSearch(query, limit);

    const dbProjects = await tryDatabase(() =>
      Project.find({
        isActive: true,
        $or: [
          { projectName: { $regex: query, $options: "i" } },
          { locationName: { $regex: query, $options: "i" } },
          { microMarket: { $regex: query, $options: "i" } },
          { builderName: { $regex: query, $options: "i" } },
          { tagline: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      })
        .limit(limit)
        .lean()
    );

    const projects =
      dbProjects ??
      featuredProjects
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.locality.toLowerCase().includes(query.toLowerCase()) ||
            p.builder.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);

    return { suggestions, projects };
  },
};
