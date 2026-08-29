import {
  BookUser,
  FileCheck2,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Matches nested routes (`/admin/applications/123`) as well as the index. */
  exact?: boolean;
};

export const adminNav: AdminNavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Visa applications", href: "/admin/applications", icon: FileCheck2 },
  { title: "Passports", href: "/admin/passports", icon: BookUser },
  { title: "Applicants", href: "/admin/customers", icon: Users },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];
