import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/project/section-header";
import { Badge } from "@/components/ui/badge";
import {
  formatPossessionLabel,
  PROJECT_STATUS_LABELS,
} from "@/lib/project/format";
import { formatPriceRange } from "@/lib/utils";
import type { ProjectPageData } from "@/types/project-page";

interface OverviewSectionProps {
  project: ProjectPageData;
}

export function OverviewSection({ project }: OverviewSectionProps) {
  const possessionLabel = formatPossessionLabel(
    project.possessionDate,
    project.status
  );

  return (
    <section id="overview" className="section-padding border-b border-border">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Overview"
          title="Project at a glance"
          description={
            project.description ??
            `Explore ${project.projectName} by ${project.builderName} on Prop AI.`
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm text-muted">Status</p>
            <p className="mt-2 text-xl font-semibold">
              {PROJECT_STATUS_LABELS[project.status]}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm text-muted">Price Range</p>
            <p className="mt-2 text-xl font-semibold">
              {formatPriceRange(project.priceRange)}
            </p>
          </div>
          {possessionLabel ? (
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-sm text-muted">Possession</p>
              <p className="mt-2 text-xl font-semibold">{possessionLabel}</p>
            </div>
          ) : null}
          {project.reraNumber ? (
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-sm text-muted">RERA Number</p>
              <p className="mt-2 text-xl font-semibold break-all">
                {project.reraNumber}
              </p>
            </div>
          ) : null}
        </div>

        {project.builder ? (
          <div
            id="builder"
            className="mt-16 rounded-[2rem] border border-border bg-gradient-to-br from-card to-accent-muted/30 p-8 sm:p-10"
          >
            <SectionHeader
              eyebrow="Builder"
              title={project.builder.name}
              description={
                project.builder.tagline ??
                project.builder.description ??
                undefined
              }
            />

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
              {project.builder.logoUrl ? (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-white">
                  <Image
                    src={project.builder.logoUrl}
                    alt={`${project.builder.name} logo`}
                    fill
                    className="object-contain p-3"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-surface-dark text-2xl font-semibold text-accent">
                  {project.builder.name.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <div className="flex flex-wrap gap-3">
                  {project.builder.rating != null ? (
                    <Badge variant="outline">
                      Rating {project.builder.rating.toFixed(1)}
                    </Badge>
                  ) : null}
                  {project.builder.establishedYear ? (
                    <Badge variant="outline">
                      Est. {project.builder.establishedYear}
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    {project.builder.projectCount} projects
                  </Badge>
                </div>

                {project.builder.headquarters ? (
                  <p className="mt-4 text-muted">
                    Headquarters: {project.builder.headquarters}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-4">
                  <Link
                    href={`/builders/${project.builder.slug}`}
                    className="text-sm font-medium text-accent underline-offset-4 hover:underline"
                  >
                    View builder profile
                  </Link>
                  {project.builder.website ? (
                    <a
                      href={project.builder.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Official website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
