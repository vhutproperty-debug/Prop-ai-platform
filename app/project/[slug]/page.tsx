import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AmenitiesSection,
  BrochureSection,
  ConfigurationSection,
  FaqSection,
  FloorPlansSection,
  GallerySection,
  HeroSection,
  LeadCaptureSection,
  LocationSection,
  NearbyPlacesSection,
  OverviewSection,
  ProjectJsonLd,
  RelatedContentSection,
} from "@/components/project";
import { ProjectPageHeader } from "@/components/project/project-page-header";
import { isDbConfigured } from "@/config/env";
import { NotFoundError } from "@/lib/errors";
import { buildProjectPageSchemas } from "@/lib/schema";
import {
  buildProjectMetadata,
  buildProjectNotFoundMetadata,
} from "@/lib/seo";
import { projectPageService } from "@/services/project-page.service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadProject(slug: string) {
  if (!isDbConfigured) {
    throw new Error("Database is not configured");
  }

  try {
    return await projectPageService.getBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isDbConfigured) {
    return buildProjectNotFoundMetadata();
  }

  try {
    const project = await projectPageService.getBySlug(slug);
    return buildProjectMetadata(project);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return buildProjectNotFoundMetadata();
    }
    throw error;
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await loadProject(slug);
  const schemas = buildProjectPageSchemas(project);

  return (
    <>
      <ProjectJsonLd schemas={schemas} />
      <div className="min-h-screen bg-background">
        <ProjectPageHeader />
        <main>
          <HeroSection project={project} />
          <OverviewSection project={project} />
          <ConfigurationSection
            configurations={project.configurations}
            projectName={project.projectName}
          />
          <AmenitiesSection amenities={project.amenities} />
          <GallerySection
            gallery={project.gallery}
            projectName={project.projectName}
          />
          <NearbyPlacesSection
            places={project.nearbyPlaces}
            projectName={project.projectName}
          />
          <FloorPlansSection
            floorPlans={project.floorPlans}
            projectName={project.projectName}
          />
          <LocationSection
            location={project.location}
            locationName={project.locationName}
            microMarket={project.microMarket}
            latitude={project.latitude}
            longitude={project.longitude}
          />
          <FaqSection faqs={project.faqs} />
          <RelatedContentSection
            projectSlug={project.slug}
            projectName={project.projectName}
            relatedProjects={project.relatedProjects}
            relatedArticles={project.relatedArticles}
          />
          <BrochureSection
            brochure={project.brochure}
            projectName={project.projectName}
          />
          <LeadCaptureSection
            projectId={project.id}
            projectSlug={project.slug}
            builderId={project.builder?.id}
            locationId={project.location?.id}
            projectName={project.projectName}
          />
        </main>
      </div>
    </>
  );
}
