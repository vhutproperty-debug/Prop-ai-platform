import Image from "next/image";
import { SectionHeader } from "@/components/project/section-header";
import type { ProjectPageImage } from "@/types/project-page";

interface FloorPlansSectionProps {
  floorPlans: ProjectPageImage[];
  projectName: string;
}

export function FloorPlansSection({
  floorPlans,
  projectName,
}: FloorPlansSectionProps) {
  if (!floorPlans.length) return null;

  return (
    <section id="floor-plans" className="section-padding border-b border-border bg-card/40">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Floor Plans"
          title="Layout options"
          description={`Floor plan references for ${projectName}.`}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {floorPlans.map((plan) => (
            <figure
              key={plan.id}
              className="overflow-hidden rounded-[2rem] border border-border bg-card"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={plan.url}
                  alt={plan.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              {plan.alt ? (
                <figcaption className="px-5 py-4 text-sm font-medium">
                  {plan.alt}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
