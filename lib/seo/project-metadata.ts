import type { Metadata } from "next";
import type { ProjectPageData } from "@/types/project-page";
import {
  projectCanonicalUrl,
  truncateDescription,
} from "@/lib/seo/urls";

function resolveTitle(project: ProjectPageData): string {
  if (project.seoTitle) return project.seoTitle;

  const locationLabel =
    project.location?.name ??
    project.locationName ??
    project.microMarket ??
    "Mumbai";

  return `${project.projectName} — ${locationLabel}`;
}

function resolveDescription(project: ProjectPageData): string {
  if (project.seoDescription) return project.seoDescription;
  if (project.tagline) return truncateDescription(project.tagline, 160);
  if (project.description) return truncateDescription(project.description, 160);

  const locationLabel =
    project.location?.name ?? project.locationName ?? "Mumbai";

  return truncateDescription(
    `${project.projectName} by ${project.builderName} in ${locationLabel}. Explore configurations, pricing, amenities, and RERA details on Prop AI.`,
    160
  );
}

function resolveOgImage(project: ProjectPageData): string | undefined {
  const cover =
    project.gallery.find((image) => image.type === "cover") ??
    project.gallery[0];

  return cover?.url;
}

export function buildProjectMetadata(project: ProjectPageData): Metadata {
  const title = resolveTitle(project);
  const description = resolveDescription(project);
  const canonical = projectCanonicalUrl(project.slug);
  const ogImage = resolveOgImage(project);

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title,
    description,
    url: canonical,
    type: "website",
    locale: "en_IN",
    siteName: "Prop AI",
  };

  if (ogImage) {
    openGraph.images = [{ url: ogImage, alt: project.projectName }];
  }

  const twitter: NonNullable<Metadata["twitter"]> = {
    card: ogImage ? "summary_large_image" : "summary",
    title,
    description,
  };

  if (ogImage) {
    twitter.images = [ogImage];
  }

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph,
    twitter,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildProjectNotFoundMetadata(): Metadata {
  return {
    title: "Project Not Found",
    robots: {
      index: false,
      follow: false,
    },
  };
}
