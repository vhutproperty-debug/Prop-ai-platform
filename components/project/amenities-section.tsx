import { SectionHeader } from "@/components/project/section-header";
import { Badge } from "@/components/ui/badge";
import type { ProjectPageAmenity } from "@/types/project-page";

interface AmenitiesSectionProps {
  amenities: ProjectPageAmenity[];
}

function formatCategory(category: string): string {
  return category.replace(/_/g, " ");
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  if (!amenities.length) return null;

  const grouped = amenities.reduce<Record<string, ProjectPageAmenity[]>>(
    (acc, amenity) => {
      const key = amenity.category;
      acc[key] = acc[key] ?? [];
      acc[key].push(amenity);
      return acc;
    },
    {}
  );

  return (
    <section id="amenities" className="section-padding border-b border-border">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Amenities"
          title="Lifestyle & conveniences"
          description="Curated amenities available across the development."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div
              key={category}
              className="rounded-[2rem] border border-border bg-card p-8"
            >
              <Badge className="mb-5 capitalize">
                {formatCategory(category)}
              </Badge>
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((amenity) => (
                  <li
                    key={amenity.id}
                    className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3"
                  >
                    <p className="font-medium">{amenity.name}</p>
                    {amenity.description ? (
                      <p className="mt-1 text-sm text-muted">
                        {amenity.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
