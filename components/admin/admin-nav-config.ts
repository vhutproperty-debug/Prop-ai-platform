import type { LucideIcon } from "lucide-react";
import {
  Building2,
  HelpCircle,
  ImageIcon,
  Import,
  FileText,
  Database,
  LayoutDashboard,
  Layers,
  MapPin,
  Menu,
  Navigation,
  Radar,
  ScanSearch,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Primary items shown in mobile bottom navigation */
  primary?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  {
    href: "/admin/mission-control",
    label: "Mission Control",
    icon: Radar,
    adminOnly: true,
    primary: true,
  },
  {
    href: "/admin/project-intelligence",
    label: "Project Intelligence",
    icon: ScanSearch,
    adminOnly: true,
  },
  { href: "/admin/builders", label: "Builders", icon: Building2 },
  { href: "/admin/projects", label: "Projects", icon: MapPin, primary: true },
  { href: "/admin/configurations", label: "Configurations", icon: Layers },
  { href: "/admin/amenities", label: "Amenities", icon: Sparkles },
  { href: "/admin/nearby-places", label: "Nearby Places", icon: Navigation },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/leads", label: "Leads", icon: Users, primary: true },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/imports", label: "Imports", icon: Import, primary: true },
  { href: "/admin/content", label: "Content Engine", icon: FileText },
  ...(process.env.NODE_ENV === "development"
    ? [{ href: "/admin/system/database", label: "Database", icon: Database }]
    : []),
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export const ADMIN_BOTTOM_NAV_ITEMS: AdminNavItem[] = [
  ...ADMIN_NAV_ITEMS.filter((item) => item.primary),
  { href: "#menu", label: "Menu", icon: Menu, primary: true },
];

export function filterAdminNavItems(
  items: AdminNavItem[],
  role: string | null
): AdminNavItem[] {
  return items.filter(
    (item) => !item.adminOnly || role === "admin"
  );
}
