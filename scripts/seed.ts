import {
  builders,
  featuredProjects,
  localities,
} from "../data/homepage";
import { connectDB } from "../lib/db/mongodb";
import { hashPassword } from "../lib/auth/password";
import { Builder } from "../models/Builder";
import { Locality } from "../models/Locality";
import { Project } from "../models/Project";
import { User } from "../models/User";

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to run the seed script");
  }

  await connectDB();

  console.log("Seeding builders...");
  for (const builder of builders) {
    await Builder.findOneAndUpdate(
      { slug: builder.slug },
      {
        slug: builder.slug,
        name: builder.name,
        logo: builder.logo,
        tagline: builder.tagline,
        projectCount: builder.projectCount,
        established: builder.established,
        rating: builder.rating,
      },
      { upsert: true, new: true }
    );
  }

  console.log("Seeding localities...");
  for (const locality of localities) {
    await Locality.findOneAndUpdate(
      { slug: locality.slug },
      {
        slug: locality.slug,
        name: locality.name,
        image: locality.image,
        investmentScore: locality.investmentScore,
        rentalScore: locality.rentalScore,
        growthScore: locality.growthScore,
        walkability: locality.walkability,
        connectivity: locality.connectivity,
        aiRecommendation: locality.aiRecommendation,
        avgPricePerSqft: locality.avgPricePerSqft,
      },
      { upsert: true, new: true }
    );
  }

  console.log("Seeding projects...");
  for (const project of featuredProjects) {
    await Project.findOneAndUpdate(
      { slug: project.slug },
      {
        slug: project.slug,
        name: project.name,
        builderName: project.builder,
        localityName: project.locality,
        configuration: project.configuration,
        priceFrom: project.priceFrom,
        priceTo: project.priceTo,
        images: [project.image],
        tagline: project.tagline,
        status: project.status,
        featured: project.featured,
      },
      { upsert: true, new: true }
    );
  }

  console.log("Seeding admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@propai.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "PropAI@Admin123";

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: "Prop AI Admin",
      email: adminEmail,
      password: await hashPassword(adminPassword),
      role: "admin",
    },
    { upsert: true, new: true }
  );

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
