"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { applicantNav } from "@/config/applicant-navigation";
import { cn } from "@/lib/utils";

export function ApplicantNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Applicant Navigation" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="px-3 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
          Applicant Console
        </p>
        {applicantNav.map(({ title, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
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
        })}
      </div>
    </nav>
  );
}
