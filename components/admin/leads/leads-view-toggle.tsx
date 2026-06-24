"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function LeadsViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "table";

  function href(nextView: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="inline-flex rounded-full border border-border bg-white p-1">
      {[
        { id: "table", label: "Table" },
        { id: "kanban", label: "Kanban" },
      ].map((item) => (
        <Link
          key={item.id}
          href={href(item.id)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            view === item.id
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
