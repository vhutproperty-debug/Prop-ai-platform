import { POI_TYPE_LABELS, type PoiType } from "@/config/location-intelligence";
import { SectionHeader } from "@/components/project/section-header";
import type { ProjectPageNearbyPlace } from "@/types/project-page";

interface NearbyPlacesSectionProps {
  places: ProjectPageNearbyPlace[];
  projectName: string;
}

export function NearbyPlacesSection({
  places,
  projectName,
}: NearbyPlacesSectionProps) {
  if (!places.length) return null;

  const grouped = places.reduce<Record<string, ProjectPageNearbyPlace[]>>(
    (acc, place) => {
      const key = place.type;
      acc[key] = acc[key] ?? [];
      acc[key].push(place);
      return acc;
    },
    {}
  );

  return (
    <section id="nearby" className="section-padding border-b border-border">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Location Intelligence"
          title="Nearby places"
          description={`Schools, hospitals, metro, and connectivity near ${projectName}.`}
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(grouped).map(([type, items]) => (
            <div
              key={type}
              className="rounded-[2rem] border border-border bg-card p-6"
            >
              <h3 className="text-lg font-semibold">
                {POI_TYPE_LABELS[type as PoiType] ?? type}
              </h3>
              <ul className="mt-4 space-y-3">
                {items.map((place) => (
                  <li key={`${place.type}-${place.name}`} className="text-sm">
                    <p className="font-medium text-foreground">{place.name}</p>
                    <p className="text-muted">
                      {[place.distanceLabel, place.travelTimeLabel]
                        .filter(Boolean)
                        .join(" · ") || "Distance on request"}
                    </p>
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
