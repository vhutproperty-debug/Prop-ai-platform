"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  ADMIN_BOTTOM_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  filterAdminNavItems,
} from "@/components/admin/admin-nav-config";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.role) setRole(json.data.role);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDrawerOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const navItems = filterAdminNavItems(ADMIN_NAV_ITEMS, role);
  const bottomItems = filterAdminNavItems(
    ADMIN_BOTTOM_NAV_ITEMS.filter((item) => item.href !== "#menu"),
    role
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <AdminSidebarNav
        items={navItems}
        collapsed={false}
        className="hidden w-64 shrink-0 lg:flex"
      />
      <AdminSidebarNav
        items={navItems}
        collapsed
        className="hidden w-[4.5rem] shrink-0 md:flex lg:hidden"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/admin/dashboard" className="text-lg font-semibold">
              Prop<span className="text-accent">AI</span>
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center px-3 text-sm text-muted"
            >
              Site
            </Link>
          </div>
        </header>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close navigation menu"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <Link href="/admin/dashboard" className="text-lg font-semibold">
                  Prop<span className="text-accent">AI</span> Admin
                </Link>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AdminSidebarNav
                items={navItems}
                embedded
                onNavigate={() => setDrawerOpen(false)}
                className="min-h-0 flex-1"
              />
            </aside>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:px-6 md:py-6 md:pb-6 lg:px-10 lg:py-10">
          {children}
        </main>

        <nav
          aria-label="Admin mobile navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {bottomItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium",
                    active ? "bg-accent-muted text-foreground" : "text-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium text-muted"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
