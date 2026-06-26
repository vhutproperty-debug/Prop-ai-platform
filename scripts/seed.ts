import { loadEnvFiles } from "../lib/env/load-env-file";
import { validateStartupEnv } from "../config/env";
import { connectDB, disconnectDB } from "../lib/db/mongodb";
import { ensureIndexes } from "../lib/db/indexes";
import { hashPassword } from "../lib/auth/password";
import { Builder } from "../models/Builder";
import { Location } from "../models/Location";
import { Project } from "../models/Project";
import { ContentArticle } from "../models/ContentArticle";
import { ContentKnowledgePack } from "../models/ContentKnowledgePack";
import { ContentCampaign } from "../models/ContentCampaign";
import { User } from "../models/User";
import { NearbyPlace } from "../models/NearbyPlace";
import {
  SEED_ARTICLE,
  SEED_BUILDER,
  SEED_CAMPAIGN,
  SEED_KNOWLEDGE_PACK,
  SEED_LOCATION,
  SEED_NEARBY_PLACES,
  SEED_PROJECT,
} from "./seed-data";

loadEnvFiles();
validateStartupEnv();

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is required. Add your MongoDB Atlas URI to .env.local"
    );
  }

  console.log("[Seed] Connecting to MongoDB Atlas...");
  await connectDB();
  await ensureIndexes();

  console.log("[Seed] Upserting builder...");
  const builder = await Builder.findOneAndUpdate(
    { slug: SEED_BUILDER.slug },
    { $set: SEED_BUILDER },
    { upsert: true, new: true }
  );

  console.log("[Seed] Upserting location...");
  const location = await Location.findOneAndUpdate(
    { slug: SEED_LOCATION.slug },
    { $set: SEED_LOCATION },
    { upsert: true, new: true }
  );

  console.log("[Seed] Upserting project...");
  const project = await Project.findOneAndUpdate(
    { slug: SEED_PROJECT.slug },
    {
      $set: {
        ...SEED_PROJECT,
        builderId: builder._id,
        location: location._id,
      },
    },
    { upsert: true, new: true }
  );

  await Builder.updateOne({ _id: builder._id }, { $set: { projectCount: 1 } });

  console.log("[Seed] Upserting nearby places...");
  for (const place of SEED_NEARBY_PLACES) {
    await NearbyPlace.findOneAndUpdate(
      { entityType: "project", entityId: project._id, slug: place.slug },
      {
        $set: {
          ...place,
          entityType: "project",
          entityId: project._id,
          projectId: project._id,
          locationId: location._id,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log("[Seed] Upserting article...");
  const article = await ContentArticle.findOneAndUpdate(
    { slug: SEED_ARTICLE.slug },
    {
      $set: {
        ...SEED_ARTICLE,
        sourceId: project._id,
        projectId: project._id,
        builderId: builder._id,
        locationId: location._id,
        projectSlug: project.slug,
        builderSlug: builder.slug,
        localitySlug: location.slug,
      },
    },
    { upsert: true, new: true }
  );

  console.log("[Seed] Upserting knowledge pack...");
  await ContentKnowledgePack.findOneAndUpdate(
    { projectId: project._id, contentType: SEED_KNOWLEDGE_PACK.contentType },
    {
      $set: {
        ...SEED_KNOWLEDGE_PACK,
        projectId: project._id,
        builderId: builder._id,
        localityId: location._id,
        articleId: article._id,
      },
    },
    { upsert: true, new: true }
  );

  console.log("[Seed] Upserting campaign...");
  await ContentCampaign.findOneAndUpdate(
    { slug: SEED_CAMPAIGN.slug },
    {
      $set: {
        ...SEED_CAMPAIGN,
        builderId: builder._id,
        projectId: project._id,
        locationId: location._id,
      },
    },
    { upsert: true, new: true }
  );

  console.log("[Seed] Upserting admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@propai.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "PropAI@Admin123";

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: "Prop AI Admin",
        email: adminEmail,
        password: await hashPassword(adminPassword),
        role: "admin",
      },
    },
    { upsert: true, new: true }
  );

  console.log("[Seed] Complete.");
  console.log(`  Builder:  ${builder.slug}`);
  console.log(`  Project:  ${project.slug}`);
  console.log(`  Article:  ${article.slug}`);
  console.log(`  Admin:    ${adminEmail} / ${adminPassword}`);

  await disconnectDB();
}

seed()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("[Seed] Failed:", error);
    try {
      await disconnectDB();
    } catch {
      // ignore
    }
    process.exit(1);
  });
