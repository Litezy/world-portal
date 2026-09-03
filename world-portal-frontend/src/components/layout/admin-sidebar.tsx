import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { UserAvatar } from "@/components/admin/user-avatar";
import { Logo } from "@/components/common/logo";
import { AdminNav } from "@/components/layout/admin-nav";
import type { AdminUser } from "@/types";

export function AdminSidebar({ user }: { user: AdminUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-border/60 bg-background/95 backdrop-blur-2xl px-5 py-6 text-foreground lg:flex">
      <div className="flex items-center justify-between">
        <Logo href="/admin" tone="dark" />
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
          Console
        </span>
      </div>

      <div className="mt-8 flex-1 overflow-y-auto pr-1">
        <AdminNav />
      </div>

      <div className="mt-auto pt-4 border-t border-border/60 flex flex-col gap-3">
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
            <p className="truncate text-[13px] font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground capitalize font-medium">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
