import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { UserAvatar } from "@/components/admin/user-avatar";
import { Logo } from "@/components/common/logo";
import { AdminNav } from "@/components/layout/admin-nav";
import type { AdminUser } from "@/types";

export function AdminSidebar({ user }: { user: AdminUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col bg-ink-950 px-5 py-6 text-white lg:flex">
      <Logo href="/admin" />

      <div className="mt-10 flex-1">
        <AdminNav />
      </div>

      <Link
        href="/"
        className="group mb-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/50 transition-colors hover:text-white"
      >
        View the site
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>

      <div className="glass-dark flex items-center gap-3 rounded-2xl p-3">
        <UserAvatar user={user} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{user.name}</p>
          <p className="truncate text-[11.5px] text-white/55 capitalize">{user.role}</p>
        </div>
      </div>
    </aside>
  );
}
