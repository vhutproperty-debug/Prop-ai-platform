import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
}

function buildHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function AdminPagination({
  page,
  totalPages,
  searchParams,
  basePath,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2 pt-6"
    >
      <Link
        href={buildHref(basePath, searchParams, Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          "min-h-[44px] rounded-full border border-border px-4 py-2 text-sm touch-manipulation",
          page <= 1 && "pointer-events-none opacity-40"
        )}
      >
        Previous
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(basePath, searchParams, p)}
          className={cn(
            "flex h-10 min-h-[44px] w-10 items-center justify-center rounded-full text-sm touch-manipulation",
            p === page
              ? "bg-foreground text-background"
              : "hidden border border-border hover:bg-foreground/5 sm:flex",
            p === page && "flex"
          )}
        >
          {p}
        </Link>
      ))}
      <span className="px-2 text-sm text-muted sm:hidden">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(basePath, searchParams, Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          "min-h-[44px] rounded-full border border-border px-4 py-2 text-sm touch-manipulation",
          page >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        Next
      </Link>
    </nav>
  );
}
