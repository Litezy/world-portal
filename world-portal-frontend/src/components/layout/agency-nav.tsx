"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { agencyNav } from "@/config/agency-navigation";
import { cn } from "@/lib/utils";

export function AgencyNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  // Same shape as the console's nav: an ungrouped Overview, then two labelled
  // groups — the day's work, then the agency's own file.
  const mainItems = agencyNav.slice(0, 1); // Overview
  const workItems = agencyNav.slice(1, 3); // Assignments, Staff
  const agencyItems = agencyNav.slice(3); // Listing, Payouts, Settings

  return (
    <nav aria-label="Agency Navigation" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        {mainItems.map(({ title, href, icon: Icon, exact }) => (
          <NavItem
            key={href}
            title={title}
            href={href}
            icon={Icon}
            active={exact ? pathname === href : pathname.startsWith(href)}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <p className="px-3 text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
          Work
        </p>
        {workItems.map(({ title, href, icon: Icon, exact }) => (
          <NavItem
            key={href}
            title={title}
            href={href}
            icon={Icon}
            active={exact ? pathname === href : pathname.startsWith(href)}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <p className="px-3 text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
          Agency
        </p>
        {agencyItems.map(({ title, href, icon: Icon, exact }) => (
          <NavItem
            key={href}
            title={title}
            href={href}
            icon={Icon}
            active={exact ? pathname === href : pathname.startsWith(href)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  title,
  href,
  icon: Icon,
  active,
  onNavigate,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "bg-primary font-semibold text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
      <span>{title}</span>
    </Link>
  );
}
