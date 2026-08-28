import {
  FileCheck2,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Matches nested routes (`/admin/enquiries/123`) as well as the index. */
  exact?: boolean;
};

export const adminNav: AdminNavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Enquiries", href: "/admin/enquiries", icon: Inbox },
  { title: "Applications", href: "/admin/applications", icon: FileCheck2 },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];
