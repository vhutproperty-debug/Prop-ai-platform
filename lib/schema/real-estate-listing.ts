import type { ProjectPageData } from "@/types/project-page";
import { projectCanonicalUrl } from "@/lib/seo/urls";

export function buildRealEstateListingSchema(project: ProjectPageData) {
  const address = project.location
    ? {
        "@type": "PostalAddress",
        addressLocality: project.location.name,
        addressRegion: project.location.state,
        addressCountry: project.location.country,
      }
    : project.locationName
      ? {
          "@type": "PostalAddress",
          addressLocality: project.locationName,
          addressRegion: "Maharashtra",
          addressCountry: "India",
        }
      : undefined;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.projectName,
    description:
      project.seoDescription ??
      project.tagline ??
      project.description ??
      `${project.projectName} by ${project.builderName}`,
    url: projectCanonicalUrl(project.slug),
    datePosted: project.possessionDate,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: project.priceRange.currency ?? "INR",
      lowPrice: project.priceRange.min,
      highPrice: project.priceRange.max,
      offerCount: project.configurations.length || 1,
    },
  };

  if (address) schema.address = address;

  if (project.latitude != null && project.longitude != null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: project.latitude,
      longitude: project.longitude,
    };
  }

  if (project.reraNumber) {
    schema.identifier = {
      "@type": "PropertyValue",
      name: "RERA",
      value: project.reraNumber,
    };
  }

  const heroImage = project.gallery[0]?.url;
  if (heroImage) schema.image = heroImage;

  if (project.builder) {
    schema.seller = {
      "@type": "Organization",
      name: project.builder.name,
      url: project.builder.website,
    };
  }

  return schema;
}
