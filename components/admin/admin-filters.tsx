"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LEAD_STATUSES } from "@/config/constants";
import { PROJECT_STATUSES } from "@/config/constants";
import { AMENITY_CATEGORIES } from "@/config/model-constants";

interface AdminFiltersProps {
  type: "builders" | "projects" | "leads" | "amenities";
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
        <FilterSelect
          label="Status"
          value={searchParams.get("status") ?? "all"}
          options={[
            { value: "all", label: "All statuses" },
            ...LEAD_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
          onChange={(v) => updateFilter("status", v)}
        />
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
      className="h-11 rounded-full border border-border bg-white px-4 text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
