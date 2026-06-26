import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { toObjectIdString } from "@/lib/utils";
import { Amenity } from "@/models/Amenity";
import { Builder } from "@/models/Builder";
import { Configuration } from "@/models/Configuration";
import { FAQ } from "@/models/FAQ";
import { Image } from "@/models/Image";
import { Location } from "@/models/Location";
import { Project } from "@/models/Project";
import { ContentArticle } from "@/models/ContentArticle";
import type {
  ProjectPageAmenity,
  ProjectPageBuilder,
  ProjectPageConfiguration,
  ProjectPageData,
  ProjectPageFaq,
  ProjectPageImage,
  ProjectPageLocation,
  ProjectPageNearbyPlace,
  ProjectPageRelatedArticle,
  ProjectPageRelatedProject,
} from "@/types/project-page";
import { nearbyPlaceService } from "@/services/location-intelligence/nearby-place.service";

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

function mapBuilder(
  builder: Record<string, unknown> | null,
  logoUrl?: string
): ProjectPageBuilder | null {
  if (!builder) return null;

  return {
    id: toObjectIdString(builder._id),
    slug: String(builder.slug),
    name: String(builder.name),
    tagline: builder.tagline ? String(builder.tagline) : undefined,
    description: builder.description ? String(builder.description) : undefined,
    website: builder.website ? String(builder.website) : undefined,
    establishedYear:
      typeof builder.establishedYear === "number"
        ? builder.establishedYear
        : undefined,
    projectCount:
      typeof builder.projectCount === "number" ? builder.projectCount : 0,
    rating: typeof builder.rating === "number" ? builder.rating : undefined,
    headquarters: builder.headquarters
      ? String(builder.headquarters)
      : undefined,
    logoUrl,
  };
}

function mapLocation(
  location: Record<string, unknown> | null
): ProjectPageLocation | null {
  if (!location) return null;

  return {
    id: toObjectIdString(location._id),
    slug: String(location.slug),
    name: String(location.name),
    city: String(location.city),
    state: String(location.state),
    country: String(location.country),
    microMarket: location.microMarket
      ? String(location.microMarket)
      : undefined,
    latitude:
      typeof location.latitude === "number" ? location.latitude : undefined,
    longitude:
      typeof location.longitude === "number" ? location.longitude : undefined,
    description: location.description
      ? String(location.description)
      : undefined,
    investmentScore:
      typeof location.investmentScore === "number"
        ? location.investmentScore
        : undefined,
    rentalScore:
      typeof location.rentalScore === "number"
        ? location.rentalScore
        : undefined,
    growthScore:
      typeof location.growthScore === "number"
        ? location.growthScore
        : undefined,
    walkability:
      typeof location.walkability === "number"
        ? location.walkability
        : undefined,
    connectivity:
      typeof location.connectivity === "number"
        ? location.connectivity
        : undefined,
  };
}

function mapConfigurations(
  items: Record<string, unknown>[]
): ProjectPageConfiguration[] {
  return items.map((item) => ({
    id: toObjectIdString(item._id),
    slug: String(item.slug),
    name: String(item.name),
    type: String(item.type),
    bhk: typeof item.bhk === "number" ? item.bhk : undefined,
    carpetArea: item.carpetArea as ProjectPageConfiguration["carpetArea"],
    builtUpArea: item.builtUpArea as ProjectPageConfiguration["builtUpArea"],
    priceRange: item.priceRange as ProjectPageConfiguration["priceRange"],
    availableUnits:
      typeof item.availableUnits === "number" ? item.availableUnits : undefined,
  }));
}

function mapAmenities(items: Record<string, unknown>[]): ProjectPageAmenity[] {
  return items.map((item) => ({
    id: toObjectIdString(item._id),
    slug: String(item.slug),
    name: String(item.name),
    category: item.category as ProjectPageAmenity["category"],
    icon: item.icon ? String(item.icon) : undefined,
    description: item.description ? String(item.description) : undefined,
  }));
}

function mapGallery(items: Record<string, unknown>[]): ProjectPageImage[] {
  return items.map((item) => ({
    id: toObjectIdString(item._id),
    url: String(item.url),
    alt: item.alt ? String(item.alt) : "Project image",
    caption: item.caption ? String(item.caption) : undefined,
    type: String(item.type ?? "gallery"),
    order: typeof item.order === "number" ? item.order : 0,
  }));
}

function mapFaqs(items: Record<string, unknown>[]): ProjectPageFaq[] {
  return items.map((item) => ({
    id: toObjectIdString(item._id),
    question: String(item.question),
    answer: String(item.answer),
    order: typeof item.order === "number" ? item.order : 0,
  }));
}

export const projectPageService = {
  async getBySlug(slug: string): Promise<ProjectPageData> {
    return withDatabase(async () => {
      const normalizedSlug = normalizeSlug(slug);

      const project = await Project.findOne({ slug: normalizedSlug })
        .select(
          "builderId builderName projectName slug location locationName microMarket configurations priceRange amenities gallery reraNumber possessionDate status latitude longitude description tagline brochure featured seoTitle seoDescription faqs isActive"
        )
        .lean();

      if (!project || !project.isActive) {
        throw new NotFoundError("Project");
      }

      const configurationIds = project.configurations ?? [];
      const amenityIds = project.amenities ?? [];
      const galleryIds = project.gallery ?? [];
      const faqIds = project.faqs ?? [];

      const [builder, location, configurations, amenities, gallery, faqs, nearbyRaw, relatedProjects, relatedArticles] =
        await Promise.all([
          Builder.findById(project.builderId)
            .select(
              "slug name tagline description website establishedYear projectCount rating headquarters logo logoUrl isActive"
            )
            .lean(),
          Location.findById(project.location)
            .select(
              "slug name city state country microMarket latitude longitude description investmentScore rentalScore growthScore walkability connectivity isActive"
            )
            .lean(),
          configurationIds.length
            ? Configuration.find({
                _id: { $in: configurationIds },
                isActive: true,
              })
                .select(
                  "slug name type bhk carpetArea builtUpArea priceRange availableUnits"
                )
                .sort({ bhk: 1, name: 1 })
                .lean()
            : [],
          amenityIds.length
            ? Amenity.find({ _id: { $in: amenityIds }, isActive: true })
                .select("slug name category icon description")
                .sort({ category: 1, name: 1 })
                .lean()
            : [],
          galleryIds.length
            ? Image.find({ _id: { $in: galleryIds }, isActive: true })
                .select("url alt caption type order")
                .sort({ order: 1 })
                .lean()
            : [],
          faqIds.length
            ? FAQ.find({ _id: { $in: faqIds }, isActive: true })
                .select("question answer order")
                .sort({ order: 1 })
                .lean()
            : [],
          nearbyPlaceService.listByProject(String(project._id)),
          Project.find({
            microMarket: project.microMarket,
            isActive: true,
            _id: { $ne: project._id },
          })
            .select("slug projectName builderName priceRange.min")
            .limit(4)
            .lean(),
          ContentArticle.find({
            projectSlug: normalizedSlug,
            status: "published",
            isActive: true,
          })
            .select("slug title contentType")
            .sort({ publishedAt: -1 })
            .limit(8)
            .lean(),
        ]);

      let builderLogoUrl = builder?.logoUrl
        ? String(builder.logoUrl)
        : undefined;

      if (!builderLogoUrl && builder?.logo) {
        const logoImage = await Image.findById(builder.logo)
          .select("url")
          .lean();
        builderLogoUrl = logoImage?.url ? String(logoImage.url) : undefined;
      }

      const activeBuilder =
        builder && builder.isActive !== false
          ? mapBuilder(builder as Record<string, unknown>, builderLogoUrl)
          : null;

      const activeLocation =
        location && location.isActive !== false
          ? mapLocation(location as Record<string, unknown>)
          : null;

      const mappedGallery = mapGallery(gallery as Record<string, unknown>[]);
      const floorPlans = mappedGallery.filter((image) => image.type === "floorplan");
      const displayGallery = mappedGallery.filter((image) => image.type !== "floorplan");

      const nearbyPlaces: ProjectPageNearbyPlace[] = nearbyRaw.map((place) => ({
        type: place.type,
        name: place.name,
        distanceLabel: place.distanceLabel,
        travelTimeLabel: place.travelTimeLabel,
      }));

      const relatedProjectRows: ProjectPageRelatedProject[] = relatedProjects.map(
        (item) => ({
          slug: String(item.slug),
          name: String(item.projectName),
          builderName: item.builderName ? String(item.builderName) : undefined,
          priceMin:
            typeof item.priceRange?.min === "number"
              ? item.priceRange.min
              : undefined,
        })
      );

      const relatedArticleRows: ProjectPageRelatedArticle[] = relatedArticles.map(
        (item) => ({
          slug: String(item.slug),
          title: String(item.title),
          contentType: String(item.contentType),
        })
      );

      return {
        id: toObjectIdString(project._id),
        slug: String(project.slug),
        projectName: String(project.projectName),
        builderName: String(project.builderName),
        tagline: project.tagline ? String(project.tagline) : undefined,
        description: project.description
          ? String(project.description)
          : undefined,
        status: project.status,
        priceRange: project.priceRange,
        reraNumber: project.reraNumber
          ? String(project.reraNumber)
          : undefined,
        possessionDate: project.possessionDate
          ? new Date(project.possessionDate).toISOString()
          : undefined,
        brochure: project.brochure ? String(project.brochure) : undefined,
        latitude:
          typeof project.latitude === "number" ? project.latitude : undefined,
        longitude:
          typeof project.longitude === "number"
            ? project.longitude
            : undefined,
        microMarket: project.microMarket
          ? String(project.microMarket)
          : undefined,
        locationName: project.locationName
          ? String(project.locationName)
          : undefined,
        featured: Boolean(project.featured),
        seoTitle: project.seoTitle ? String(project.seoTitle) : undefined,
        seoDescription: project.seoDescription
          ? String(project.seoDescription)
          : undefined,
        builder: activeBuilder,
        location: activeLocation,
        configurations: mapConfigurations(
          configurations as Record<string, unknown>[]
        ),
        amenities: mapAmenities(amenities as Record<string, unknown>[]),
        gallery: displayGallery,
        faqs: mapFaqs(faqs as Record<string, unknown>[]),
        nearbyPlaces,
        floorPlans,
        relatedProjects: relatedProjectRows,
        relatedArticles: relatedArticleRows,
      };
    });
  },
};
