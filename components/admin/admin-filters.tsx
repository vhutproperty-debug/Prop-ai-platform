"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LEAD_SCORES, LEAD_SOURCES, LEAD_STATUSES } from "@/config/constants";
import { PROJECT_STATUSES } from "@/config/constants";
import { AMENITY_CATEGORIES } from "@/config/model-constants";
import { POI_TYPES, POI_TYPE_LABELS } from "@/config/location-intelligence";
import {
  LEAD_SCORE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/labels";

interface AdminFiltersProps {
  type: "builders" | "projects" | "leads" | "amenities" | "nearby-places";
}

export function AdminFilters({ type }: AdminFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {type === "builders" ? (
        <>
          <FilterSelect
            label="Status"
            value={searchParams.get("isActive") ?? "all"}
            options={[
              { value: "all", label: "All" },
              { value: "true", label: "Published" },
              { value: "false", label: "Draft" },
            ]}
            onChange={(v) => updateFilter("isActive", v)}
          />
          <FilterSelect
            label="Featured"
            value={searchParams.get("isFeatured") ?? "all"}
            options={[
              { value: "all", label: "All" },
              { value: "true", label: "Featured" },
              { value: "false", label: "Not featured" },
            ]}
            onChange={(v) => updateFilter("isFeatured", v)}
          />
        </>
      ) : null}

      {type === "projects" ? (
        <>
          <FilterSelect
            label="Status"
            value={searchParams.get("status") ?? "all"}
            options={[
              { value: "all", label: "All statuses" },
              ...PROJECT_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            onChange={(v) => updateFilter("status", v)}
          />
          <FilterSelect
            label="Published"
            value={searchParams.get("isActive") ?? "all"}
            options={[
              { value: "all", label: "All" },
              { value: "true", label: "Published" },
              { value: "false", label: "Draft" },
            ]}
            onChange={(v) => updateFilter("isActive", v)}
          />
          <FilterSelect
            label="Featured"
            value={searchParams.get("featured") ?? "all"}
            options={[
              { value: "all", label: "All" },
              { value: "true", label: "Featured" },
              { value: "false", label: "Not featured" },
            ]}
            onChange={(v) => updateFilter("featured", v)}
          />
        </>
      ) : null}

      {type === "leads" ? (
        <>
          <FilterSelect
            label="Status"
            value={searchParams.get("status") ?? "all"}
            options={[
              { value: "all", label: "All statuses" },
              ...LEAD_STATUSES.map((s) => ({
                value: s,
                label: LEAD_STATUS_LABELS[s],
              })),
            ]}
            onChange={(v) => updateFilter("status", v)}
          />
          <FilterSelect
            label="Source"
            value={searchParams.get("source") ?? "all"}
            options={[
              { value: "all", label: "All sources" },
              ...LEAD_SOURCES.map((s) => ({
                value: s,
                label: LEAD_SOURCE_LABELS[s],
              })),
            ]}
            onChange={(v) => updateFilter("source", v)}
          />
          <FilterSelect
            label="Score"
            value={searchParams.get("score") ?? "all"}
            options={[
              { value: "all", label: "All scores" },
              ...LEAD_SCORES.map((s) => ({
                value: s,
                label: LEAD_SCORE_LABELS[s],
              })),
            ]}
            onChange={(v) => updateFilter("score", v)}
          />
          <FilterSelect
            label="Assignment"
            value={searchParams.get("unassigned") ?? "all"}
            options={[
              { value: "all", label: "All leads" },
              { value: "true", label: "Unassigned only" },
            ]}
            onChange={(v) => updateFilter("unassigned", v)}
          />
        </>
      ) : null}

      {type === "amenities" ? (
        <FilterSelect
          label="Category"
          value={searchParams.get("category") ?? "all"}
          options={[
            { value: "all", label: "All categories" },
            ...AMENITY_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          onChange={(v) => updateFilter("category", v)}
        />
      ) : null}

      {type === "nearby-places" ? (
        <>
          <FilterSelect
            label="Type"
            value={searchParams.get("type") ?? "all"}
            options={[
              { value: "all", label: "All types" },
              ...POI_TYPES.map((t) => ({ value: t, label: POI_TYPE_LABELS[t] })),
            ]}
            onChange={(v) => updateFilter("type", v)}
          />
          <FilterSelect
            label="Status"
            value={searchParams.get("isActive") ?? "all"}
            options={[
              { value: "all", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            onChange={(v) => updateFilter("isActive", v)}
          />
        </>
      ) : null}

      {searchParams.toString() ? (
        <Link href={pathname} className="self-center text-sm text-accent hover:underline">
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 min-h-[44px] rounded-full border border-border bg-white px-4 text-sm touch-manipulation md:h-11"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
