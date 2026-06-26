import "@/lib/db/setup-dns";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { dbLogger } from "@/lib/db/logger";
import { Location } from "@/models/Location";
import {
  Builder,
  Project,
  ContentArticle,
  ContentKnowledgePack,
  ContentCampaign,
  ContentJob,
  ContentAuditLog,
  ContentVersion,
  ContentPerformance,
  NearbyPlace,
} from "@/models";

export interface CrudTestResult {
  entity: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  error?: string;
  durationMs: number;
}

const TEST_PREFIX = "__crud_verify__";

interface CrudFixtures {
  builder: { _id: mongoose.Types.ObjectId; name: string; slug: string };
  location: { _id: mongoose.Types.ObjectId; name: string; slug: string };
  project: { _id: mongoose.Types.ObjectId; slug: string };
}

async function ensureSharedCrudFixtures(): Promise<CrudFixtures> {
  const builder = await Builder.findOneAndUpdate(
    { slug: `${TEST_PREFIX}shared-builder` },
    {
      slug: `${TEST_PREFIX}shared-builder`,
      name: "CRUD Shared Builder",
      isActive: true,
    },
    { upsert: true, new: true }
  );
  const location = await Location.findOneAndUpdate(
    { slug: `${TEST_PREFIX}shared-location` },
    {
      slug: `${TEST_PREFIX}shared-location`,
      name: "CRUD Shared Location",
      city: "Mumbai",
      isActive: true,
    },
    { upsert: true, new: true }
  );
  const project = await Project.findOneAndUpdate(
    { slug: `${TEST_PREFIX}shared-project` },
    {
      builderId: builder._id,
      builderName: builder.name,
      projectName: "CRUD Shared Project",
      slug: `${TEST_PREFIX}shared-project`,
      location: location._id,
      locationName: location.name,
      priceRange: { min: 5_000_000, max: 10_000_000, currency: "INR" },
      isActive: true,
    },
    { upsert: true, new: true }
  );

  return {
    builder: { _id: builder._id, name: builder.name, slug: builder.slug },
    location: { _id: location._id, name: location.name, slug: location.slug },
    project: { _id: project._id, slug: project.slug },
  };
}

async function cleanupSharedCrudFixtures() {
  await Promise.all([
    ContentArticle.deleteMany({ slug: { $regex: `^${TEST_PREFIX}` } }),
    ContentPerformance.deleteMany({ articleSlug: { $regex: `^${TEST_PREFIX}` } }),
    NearbyPlace.deleteMany({ slug: { $regex: `^${TEST_PREFIX}` } }),
    Project.deleteMany({ slug: { $regex: `^${TEST_PREFIX}` } }),
    Builder.deleteMany({ slug: { $regex: `^${TEST_PREFIX}` } }),
    Location.deleteMany({ slug: { $regex: `^${TEST_PREFIX}` } }),
  ]);
}

async function runCrudTest(
  entity: string,
  handlers: {
    create: () => Promise<mongoose.Types.ObjectId>;
    read: (id: mongoose.Types.ObjectId) => Promise<boolean>;
    update: (id: mongoose.Types.ObjectId) => Promise<boolean>;
    delete: (id: mongoose.Types.ObjectId) => Promise<void>;
  }
): Promise<CrudTestResult> {
  const started = Date.now();
  const result: CrudTestResult = {
    entity,
    create: false,
    read: false,
    update: false,
    delete: false,
    durationMs: 0,
  };

  let id: mongoose.Types.ObjectId | null = null;

  try {
    id = await handlers.create();
    result.create = true;

    result.read = await handlers.read(id);
    result.update = await handlers.update(id);

    await handlers.delete(id);
    result.delete = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    dbLogger.writeFailure(entity, error);

    if (id) {
      try {
        await handlers.delete(id);
      } catch {
        // cleanup best effort
      }
    }
  }

  result.durationMs = Date.now() - started;
  return result;
}

export const crudVerificationService = {
  async runAll(): Promise<CrudTestResult[]> {
    await connectDB();
    const fixtures = await ensureSharedCrudFixtures();

    const tests: Array<() => Promise<CrudTestResult>> = [
      () =>
        runCrudTest("Builder", {
          create: async () => {
            const doc = await Builder.create({
              slug: `${TEST_PREFIX}builder`,
              name: "CRUD Test Builder",
              isActive: true,
            });
            return doc._id;
          },
          read: async (id) => Boolean(await Builder.findById(id).lean()),
          update: async (id) => {
            const doc = await Builder.findByIdAndUpdate(
              id,
              { $set: { tagline: "updated" } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await Builder.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("Project", {
          create: async () => {
            const builder = await Builder.findOneAndUpdate(
              { slug: `${TEST_PREFIX}builder-project` },
              {
                slug: `${TEST_PREFIX}builder-project`,
                name: "CRUD Project Builder",
                isActive: true,
              },
              { upsert: true, new: true }
            );
            const location = await Location.findOneAndUpdate(
              { slug: `${TEST_PREFIX}location` },
              {
                slug: `${TEST_PREFIX}location`,
                name: "CRUD Test Location",
                city: "Mumbai",
                isActive: true,
              },
              { upsert: true, new: true }
            );
            const doc = await Project.create({
              builderId: builder._id,
              builderName: builder.name,
              projectName: "CRUD Test Project",
              slug: `${TEST_PREFIX}project`,
              location: location._id,
              locationName: location.name,
              priceRange: { min: 5_000_000, max: 10_000_000, currency: "INR" },
              isActive: true,
            });
            return doc._id;
          },
          read: async (id) => Boolean(await Project.findById(id).lean()),
          update: async (id) => {
            const doc = await Project.findByIdAndUpdate(
              id,
              { $set: { tagline: "crud-updated" } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await Project.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("NearbyPlace", {
          create: async () => {
            const doc = await NearbyPlace.create({
              entityType: "project",
              entityId: fixtures.project._id,
              projectId: fixtures.project._id,
              locationId: fixtures.location._id,
              type: "school",
              name: "CRUD Test School",
              slug: `${TEST_PREFIX}school`,
              distanceLabel: "1 km",
              source: "manual",
              confidence: "high",
              isActive: true,
            });
            return doc._id;
          },
          read: async (id) => Boolean(await NearbyPlace.findById(id).lean()),
          update: async (id) => {
            const doc = await NearbyPlace.findByIdAndUpdate(
              id,
              { $set: { distanceLabel: "1.5 km" } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await NearbyPlace.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("ContentArticle", {
          create: async () => {
            const doc = await ContentArticle.create({
              title: "CRUD Test Article",
              slug: `${TEST_PREFIX}article`,
              contentType: "project_guide",
              status: "draft",
              sourceType: "project",
              sourceId: fixtures.project._id,
              projectId: fixtures.project._id,
              projectSlug: fixtures.project.slug,
              introduction: "CRUD test",
              sections: [{ id: "s1", heading: "Test", body: "Body", order: 1 }],
              keywords: ["test"],
            });
            return doc._id;
          },
          read: async (id) => Boolean(await ContentArticle.findById(id).lean()),
          update: async (id) => {
            const doc = await ContentArticle.findByIdAndUpdate(
              id,
              { $set: { featuredSummary: "updated" } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await ContentArticle.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("ContentKnowledgePack", {
          create: async () => {
            const doc = await ContentKnowledgePack.create({
              projectId: fixtures.project._id,
              contentType: "project_guide",
              pack: { verifiedFacts: [], researchedAt: new Date().toISOString() },
              verifiedFacts: [],
              dataCompleteness: 50,
            });
            return doc._id;
          },
          read: async (id) => Boolean(await ContentKnowledgePack.findById(id).lean()),
          update: async (id) => {
            const doc = await ContentKnowledgePack.findByIdAndUpdate(
              id,
              { $set: { dataCompleteness: 60 } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await ContentKnowledgePack.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("ContentCampaign", {
          create: async () => {
            const doc = await ContentCampaign.create({
              name: "CRUD Test Campaign",
              slug: `${TEST_PREFIX}campaign`,
              type: "project",
              isActive: true,
            });
            return doc._id;
          },
          read: async (id) => Boolean(await ContentCampaign.findById(id).lean()),
          update: async (id) => {
            const doc = await ContentCampaign.findByIdAndUpdate(
              id,
              { $set: { description: "updated" } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await ContentCampaign.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("ContentJob", {
          create: async () => {
            const doc = await ContentJob.create({
              type: "generate",
              status: "queued",
              payload: { test: true },
            });
            return doc._id;
          },
          read: async (id) => Boolean(await ContentJob.findById(id).lean()),
          update: async (id) => {
            const doc = await ContentJob.findByIdAndUpdate(
              id,
              { $set: { status: "completed" } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await ContentJob.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("ContentAuditLog", {
          create: async () => {
            const doc = await ContentAuditLog.create({
              action: "created",
              meta: { crudTest: true },
            });
            return doc._id;
          },
          read: async (id) => Boolean(await ContentAuditLog.findById(id).lean()),
          update: async (id) => {
            const doc = await ContentAuditLog.findByIdAndUpdate(
              id,
              { $set: { meta: { updated: true } } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await ContentAuditLog.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("ContentVersion", {
          create: async () => {
            const article = await ContentArticle.create({
              title: "CRUD Version Article",
              slug: `${TEST_PREFIX}version-article`,
              contentType: "project_guide",
              status: "draft",
              sourceType: "project",
              sourceId: fixtures.project._id,
              projectId: fixtures.project._id,
              projectSlug: fixtures.project.slug,
              introduction: "Version test",
              sections: [{ id: "s1", heading: "Test", body: "Body", order: 1 }],
              keywords: ["test"],
            });
            const doc = await ContentVersion.create({
              articleId: article._id,
              version: Date.now(),
              snapshot: { test: true },
            });
            return doc._id;
          },
          read: async (id) => Boolean(await ContentVersion.findById(id).lean()),
          update: async (id) => {
            const doc = await ContentVersion.findByIdAndUpdate(
              id,
              { $set: { changeReason: "crud update" } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await ContentVersion.deleteOne({ _id: id });
          },
        }),

      () =>
        runCrudTest("ContentPerformance", {
          create: async () => {
            const doc = await ContentPerformance.create({
              articleId: new mongoose.Types.ObjectId(),
              articleSlug: `${TEST_PREFIX}perf`,
              organicTraffic: 0,
            });
            return doc._id;
          },
          read: async (id) => Boolean(await ContentPerformance.findById(id).lean()),
          update: async (id) => {
            const doc = await ContentPerformance.findByIdAndUpdate(
              id,
              { $set: { organicTraffic: 1 } },
              { new: true }
            );
            return Boolean(doc);
          },
          delete: async (id) => {
            await ContentPerformance.deleteOne({ _id: id });
          },
        }),
    ];

    const results: CrudTestResult[] = [];
    try {
      for (const test of tests) {
        results.push(await test());
      }
      return results;
    } finally {
      await cleanupSharedCrudFixtures();
    }
  },
};
