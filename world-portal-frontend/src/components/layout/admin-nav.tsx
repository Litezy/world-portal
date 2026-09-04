"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNav } from "@/config/admin-navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  // Group items by category
  const mainItems = adminNav.slice(0, 1); // Overview
  const opsItems = adminNav.slice(1, 4); // Visa applications, Passports, Financials
  const mgmtItems = adminNav.slice(4); // Applicants, Settings

  return (
    <nav aria-label="Console Navigation" className="flex flex-col gap-6">
      {/* Main Section */}
      <div className="flex flex-col gap-1">
        {mainItems.map(({ title, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <NavItem
              key={href}
              title={title}
              href={href}
              icon={Icon}
              active={active}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>

      {/* Operations Section */}
      <div className="flex flex-col gap-1">
        <p className="px-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-widest">
          Operations
        </p>
        {opsItems.map(({ title, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <NavItem
              key={href}
              title={title}
              href={href}
              icon={Icon}
              active={active}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>

      {/* Management Section */}
      <div className="flex flex-col gap-1">
        <p className="px-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-widest">
          Management
        </p>
        {mgmtItems.map(({ title, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <NavItem
              key={href}
              title={title}
              href={href}
              icon={Icon}
              active={active}
              onNavigate={onNavigate}
            />
          );
        })}
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
          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",

      )}
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
      <span>{title}</span>
    </Link>
  );
}
