import {
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Store,
  Users,
  Wallet,
} from "lucide-react";

export type AgencyNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Matches nested routes (`/agency/assignments/123`) as well as the index. */
  exact?: boolean;
};

export const agencyNav: AgencyNavItem[] = [
  { title: "Overview", href: "/agency", icon: LayoutDashboard, exact: true },
  { title: "Assignments", href: "/agency/assignments", icon: ClipboardList },
  { title: "Staff", href: "/agency/staff", icon: Users },
  { title: "Listing", href: "/agency/listing", icon: Store },
  { title: "Payouts", href: "/agency/payouts", icon: Wallet },
  { title: "Settings", href: "/agency/settings", icon: Settings },
];
