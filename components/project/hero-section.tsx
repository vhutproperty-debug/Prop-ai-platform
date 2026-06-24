import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS } from "@/lib/project/format";
import { formatPriceRange } from "@/lib/utils";
import type { ProjectPageData } from "@/types/project-page";

interface HeroSectionProps {
  project: ProjectPageData;
}

function resolveHeroImage(project: ProjectPageData): string | null {
  const cover = project.gallery.find((image) => image.type === "cover");
  return cover?.url ?? project.gallery[0]?.url ?? null;
}

export function HeroSection({ project }: HeroSectionProps) {
  const heroImage = resolveHeroImage(project);
  const locationLabel =
    project.location?.name ?? project.locationName ?? project.microMarket;

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface-dark text-white">
      <div className="absolute inset-0">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={project.projectName}
            fill
            priority
            className="object-cover opacity-50"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full luxury-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/70 to-surface-dark/30" />
      </div>

      <div className="relative container-premium pb-16 pt-28 sm:pb-20 sm:pt-32">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-white/70">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <span aria-hidden>/</span>
          {project.location ? (
            <>
              <Link
                href={`/localities/${project.location.slug}`}
                className="transition-colors hover:text-white"
              >
                {project.location.name}
              </Link>
              <span aria-hidden>/</span>
            </>
          ) : locationLabel ? (
            <>
              <span>{locationLabel}</span>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span className="text-white">{project.projectName}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
          {project.featured ? (
            <Badge className="border-accent/30 bg-accent/20 text-accent hover:bg-accent/20">
              Featured
            </Badge>
          ) : null}
        </div>

        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-accent">
          {project.builderName}
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          {project.projectName}
        </h1>
        {project.tagline ? (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            {project.tagline}
          </p>
        ) : null}

        <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {locationLabel ? (
            <div>
              <dt className="text-sm text-white/60">Location</dt>
              <dd className="mt-1 text-lg font-medium">{locationLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-sm text-white/60">Price Range</dt>
            <dd className="mt-1 text-lg font-medium">
              {formatPriceRange(project.priceRange)}
            </dd>
          </div>
          {project.configurations.length > 0 ? (
            <div>
              <dt className="text-sm text-white/60">Configurations</dt>
              <dd className="mt-1 text-lg font-medium">
                {project.configurations.map((config) => config.type).join(", ")}
              </dd>
            </div>
          ) : null}
          {project.reraNumber ? (
            <div>
              <dt className="text-sm text-white/60">RERA</dt>
              <dd className="mt-1 text-lg font-medium">{project.reraNumber}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
