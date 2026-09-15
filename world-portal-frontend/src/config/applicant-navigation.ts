import {
  FileCheck2,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Users,
} from "lucide-react";

export type ApplicantNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const applicantNav: ApplicantNavItem[] = [
  {
    title: "Overview",
    href: "/applicant",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "My Applications",
    href: "/applicant/applications",
    icon: FileCheck2,
  },
  {
    title: "Hired Professionals",
    href: "/applicant/hires",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/applicant/settings",
    icon: Settings,
  },
];

