import Link from "next/link";
import { SectionHeader } from "@/components/project/section-header";
import type { ProjectPageLocation } from "@/types/project-page";

interface LocationSectionProps {
  location: ProjectPageLocation | null;
  locationName?: string;
  microMarket?: string;
  latitude?: number;
  longitude?: number;
}

function buildMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function LocationSection({
  location,
  locationName,
  microMarket,
  latitude,
  longitude,
}: LocationSectionProps) {
  const name = location?.name ?? locationName;
  if (!name && latitude == null && longitude == null) return null;

  const city = location?.city ?? "Mumbai";
  const state = location?.state ?? "Maharashtra";
  const country = location?.country ?? "India";
  const resolvedLat = latitude ?? location?.latitude;
  const resolvedLng = longitude ?? location?.longitude;
  const resolvedMicroMarket = microMarket ?? location?.microMarket;

  return (
    <section id="location" className="section-padding border-b border-border">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Location"
          title={name ?? "Project location"}
          description={
            location?.description ??
            `Situated in ${name ?? city}, ${state}.`
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-border bg-card p-8">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">Locality</dt>
                <dd className="mt-2 text-lg font-medium">{name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">City</dt>
                <dd className="mt-2 text-lg font-medium">{city}</dd>
              </div>
              {resolvedMicroMarket ? (
                <div>
                  <dt className="text-sm text-muted">Micro-market</dt>
                  <dd className="mt-2 text-lg font-medium">
                    {resolvedMicroMarket}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-sm text-muted">Region</dt>
                <dd className="mt-2 text-lg font-medium">
                  {state}, {country}
                </dd>
              </div>
            </dl>

            {location ? (
              <Link
                href={`/localities/${location.slug}`}
                className="mt-8 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Explore {location.name}
              </Link>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Connectivity
            </p>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {location?.investmentScore != null ? (
                <div>
                  <dt className="text-sm text-muted">Investment score</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {location.investmentScore}
                  </dd>
                </div>
              ) : null}
              {location?.rentalScore != null ? (
                <div>
                  <dt className="text-sm text-muted">Rental score</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {location.rentalScore}
                  </dd>
                </div>
              ) : null}
              {location?.growthScore != null ? (
                <div>
                  <dt className="text-sm text-muted">Growth score</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {location.growthScore}
                  </dd>
                </div>
              ) : null}
              {location?.walkability != null ? (
                <div>
                  <dt className="text-sm text-muted">Walkability</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {location.walkability}
                  </dd>
                </div>
              ) : null}
              {location?.connectivity != null ? (
                <div>
                  <dt className="text-sm text-muted">Connectivity</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {location.connectivity}
                  </dd>
                </div>
              ) : null}
            </dl>

            {resolvedLat != null && resolvedLng != null ? (
              <a
                href={buildMapsUrl(resolvedLat, resolvedLng)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
