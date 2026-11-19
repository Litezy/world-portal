"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  type AdminNavItem,
  isNavItemActive,
  navGroupsFor,
} from "@/config/admin-navigation";
import { adminBrand } from "@/content/admin";
import { useDashboard } from "@/features/dashboard/api/use-dashboard";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types";

/**
 * Grouped, role-filtered navigation: a role only ever sees the pages the
 * service will actually serve it. The two work queues carry a live count of
 * open files (from the overview the dashboard already loads), after the
 * WorldStreet desks: the number that tells you where the work is.
 */
export function AdminNav({
  role,
  onNavigate,
}: {
  role: AdminRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { data } = useDashboard({ enabled: role !== "PARTNER" });
  const counts: Record<string, number | undefined> = {
    "/admin/applications": data?.stats.visas.active,
    "/admin/passports": data?.stats.passports.active,
  };

  return (
    <nav aria-label={adminBrand.navLabel} className="flex flex-col gap-5">
      {navGroupsFor(role).map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-0.5">
          {group.label ? (
            <p className="px-3 pb-1 text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              count={counts[item.href]}
              active={isNavItemActive(item, pathname)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function NavItem({
  item: { title, href, icon: Icon },
  count,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  count?: number;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "bg-muted font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {/* The marker: a short bar in the brand colour, so "here" isn't colour-fill alone. */}
      {active ? (
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-primary"
        />
      ) : null}
      <Icon
        className={cn("size-4 shrink-0", active && "text-primary")}
        strokeWidth={active ? 2.2 : 1.9}
      />
      <span className="flex-1 truncate">{title}</span>
      {count ? (
        <span
          aria-label={`${count} open`}
          className="min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] leading-5 font-bold text-primary-foreground tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
