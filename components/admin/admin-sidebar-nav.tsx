"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminNavItem } from "@/components/admin/admin-nav-config";

interface AdminSidebarNavProps {
  items: AdminNavItem[];
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
  embedded?: boolean;
}

export function AdminSidebarNav({
  items,
  collapsed = false,
  className,
  onNavigate,
  embedded = false,
}: AdminSidebarNavProps) {
  const pathname = usePathname();

  const content = (
    <>
      {!collapsed && !embedded ? (
        <div className="border-b border-border px-6 py-5">
          <Link href="/admin/dashboard" className="text-lg font-semibold">
            Prop<span className="text-accent">AI</span> Admin
          </Link>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-2xl font-medium transition-colors touch-manipulation",
                collapsed
                  ? "justify-center px-2 py-3"
                  : "gap-3 px-4 py-2.5 text-sm",
                active
                  ? "bg-accent-muted text-foreground"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed && !embedded ? (
        <div className="border-t border-border p-4">
          <Link
            href="/"
            onClick={onNavigate}
            className="block rounded-2xl px-4 py-2.5 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            View Site
          </Link>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className={cn("flex min-h-0 flex-1 flex-col", className)}>{content}</div>;
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-white",
        collapsed ? "w-[4.5rem]" : "w-64",
        className
      )}
    >
      <div className="sticky top-0 flex h-screen flex-col">{content}</div>
    </aside>
  );
}
