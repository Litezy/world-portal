import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { UserAvatar } from "@/components/admin/user-avatar";
import { Logo } from "@/components/common/logo";
import { AgencyNav } from "@/components/layout/agency-nav";
import type { AgencyUser } from "@/features/agency/types";

export function AgencySidebar({ user }: { user: AgencyUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-border/60 bg-background/95 px-5 py-6 text-foreground backdrop-blur-2xl lg:flex">
      <div className="flex items-center justify-between gap-2">
        <Logo href="/agency" tone="dark" />
        {/* The console's pill says "Console"; this one says whose desk it is,
            so the two are never mistaken for each other. */}
        <span
          title={user.agencyName}
          className="max-w-[104px] truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary"
        >
          {user.agencyName}
        </span>
      </div>

      <div className="mt-8 flex-1 overflow-y-auto pr-1">
        <AgencyNav />
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View live site
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/50 p-3">
          <UserAvatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {user.name}
            </p>
            <p className="truncate text-[11px] font-medium text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
