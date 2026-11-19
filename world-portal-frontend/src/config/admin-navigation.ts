import {
  BookUser,
  Briefcase,
  Building2,
  CreditCard,
  FileCheck2,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Users,
} from "lucide-react";

import type { AdminRole } from "@/types";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Matches only the index route; otherwise nested routes are active too. */
  exact?: boolean;
  /**
   * Who may open it. Mirrors the World Portal API's own `@Roles` on the calls
   * the page makes, so the console never offers a page that answers 403.
   */
  roles: readonly AdminRole[];
};

export type AdminNavGroup = {
  /** Omitted for the first, unlabelled group. */
  label?: string;
  items: AdminNavItem[];
};

const DESK = ["MANAGER", "STAFF"] as const;
const EVERYONE = ["MANAGER", "STAFF", "PARTNER"] as const;

/**
 * The console's navigation, grouped. Groups are declared here — never sliced
 * by index — so reordering an item can't silently move it to another group.
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    items: [
      {
        title: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
        roles: DESK,
      },
    ],
  },
  {
    label: "Applications",
    items: [
      {
        title: "Visa applications",
        href: "/admin/applications",
        icon: FileCheck2,
        roles: EVERYONE,
      },
      { title: "Passports", href: "/admin/passports", icon: BookUser, roles: EVERYONE },
      { title: "Applicants", href: "/admin/customers", icon: Users, roles: EVERYONE },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Financials", href: "/admin/finance", icon: CreditCard, roles: DESK },
    ],
  },
  {
    label: "Partners",
    items: [
      { title: "Agencies", href: "/admin/agencies", icon: Building2, roles: DESK },
      {
        title: "Professionals",
        href: "/admin/professionals",
        icon: Briefcase,
        roles: DESK,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Settings", href: "/admin/settings", icon: Settings, roles: EVERYONE },
    ],
  },
];

/** Every item, flat — for search and the role gate. */
export const adminNav: AdminNavItem[] = adminNavGroups.flatMap((group) => group.items);

export function isNavItemActive(
  item: Pick<AdminNavItem, "href" | "exact">,
  pathname: string,
) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The groups this role can see, empty groups dropped. */
export function navGroupsFor(role: AdminRole): AdminNavGroup[] {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

/** The nav item a path belongs to (the longest matching `href`), if any. */
export function navItemFor(pathname: string): AdminNavItem | undefined {
  return [...adminNav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isNavItemActive(item, pathname));
}

/** Where a role lands when it signs in or is turned away from a page. */
export function homeFor(role: AdminRole) {
  return adminNav.find((item) => item.roles.includes(role))?.href ?? "/admin/settings";
}
