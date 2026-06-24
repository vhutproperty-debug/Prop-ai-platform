"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  HelpCircle,
  ImageIcon,
  Import,
  LayoutDashboard,
  Layers,
  MapPin,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/builders", label: "Builders", icon: Building2 },
  { href: "/admin/projects", label: "Projects", icon: MapPin },
  { href: "/admin/configurations", label: "Configurations", icon: Layers },
  { href: "/admin/amenities", label: "Amenities", icon: Sparkles },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/imports", label: "Imports", icon: Import },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-border px-6 py-5">
          <Link href="/admin/dashboard" className="text-lg font-semibold">
            Prop<span className="text-accent">AI</span> Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent-muted text-foreground"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="block rounded-2xl px-4 py-2.5 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            View Site
          </Link>
        </div>
      </div>
    </aside>
  );
}
