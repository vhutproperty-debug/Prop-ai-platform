import { SectionHeader } from "@/components/project/section-header";
import { formatAreaRange } from "@/lib/project/format";
import { formatPriceRange } from "@/lib/utils";
import type { ProjectPageConfiguration } from "@/types/project-page";

interface ConfigurationSectionProps {
  configurations: ProjectPageConfiguration[];
  projectName: string;
}

export function ConfigurationSection({
  configurations,
  projectName,
}: ConfigurationSectionProps) {
  if (!configurations.length) return null;

  return (
    <section id="configurations" className="section-padding border-b border-border bg-card/40">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Configurations"
          title="Homes & floor plans"
          description={`Available unit types at ${projectName}.`}
        />

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-border bg-background/60">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-muted">
                    Configuration
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted">
                    Carpet Area
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted">
                    Built-up Area
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted">
                    Price Range
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted">
                    Availability
                  </th>
                </tr>
              </thead>
              <tbody>
                {configurations.map((config) => (
                  <tr
                    key={config.id}
                    className="border-b border-border/70 last:border-b-0"
                  >
                    <td className="px-6 py-5">
                      <p className="font-medium">{config.name}</p>
                      <p className="mt-1 text-sm text-muted">{config.type}</p>
                    </td>
                    <td className="px-6 py-5 text-muted">
                      {formatAreaRange(config.carpetArea) ?? "—"}
                    </td>
                    <td className="px-6 py-5 text-muted">
                      {formatAreaRange(config.builtUpArea) ?? "—"}
                    </td>
                    <td className="px-6 py-5 font-medium">
                      {formatPriceRange(config.priceRange)}
                    </td>
                    <td className="px-6 py-5 text-muted">
                      {config.availableUnits != null
                        ? `${config.availableUnits} units`
                        : "On request"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
