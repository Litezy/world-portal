"use client";

import Link from "next/link";

import { ArrowLeft, LogOut, Search, X } from "lucide-react";

import { AdminLogo, AppearanceMenu } from "@/components/admin/admin-palette";
import { AdminUserCard } from "@/components/admin/admin-user-card";
import { AdminNav } from "@/components/layout/admin-nav";
import { Button } from "@/components/ui/button";
import { adminBrand } from "@/content/admin";
import { useLogout } from "@/features/auth/api/use-logout";
import type { ClientAdminUser } from "@/types";

/** Opens the search palette (it lives in the top bar) from anywhere. */
export const OPEN_ADMIN_SEARCH = "admin:open-search";

export function openAdminSearch() {
  window.dispatchEvent(new Event(OPEN_ADMIN_SEARCH));
}

/**
 * The admin's chrome, after WorldStreet's desks (WS Predict Admin): the name,
 * a search box, the pages grouped by the kind of work with live counts on
 * the queues, and at the foot the colours, who you are, sign out and the way
 * back to the site. The same body fills the desktop sidebar and the phone
 * drawer (`onClose` adds the drawer's close button).
 */
export function AdminSidebarContent({
  user,
  onNavigate,
  onClose,
}: {
  user: ClientAdminUser;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const logout = useLogout();

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-start justify-between gap-2 px-5 pt-5 pb-4">
        <div className="flex flex-col gap-1">
          <AdminLogo href="/admin" markClassName="h-7 sm:h-7" />
          <span className="pl-0.5 text-[10.5px] font-semibold tracking-[0.16em] text-primary uppercase">
            {adminBrand.tag}
          </span>
        </div>
        {onClose ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close navigation"
            onClick={onClose}
            className="-mr-2 text-muted-foreground hover:text-foreground"
          >
            <X />
          </Button>
        ) : null}
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            openAdminSearch();
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-border/80 bg-background px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="flex-1 truncate text-left">
            {adminBrand.searchPlaceholder}
          </span>
          <kbd className="hidden rounded border border-border/70 px-1.5 font-mono text-[10px] lg:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <AdminNav role={user.role} onNavigate={onNavigate} />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border/70 px-3 py-3">
        <AppearanceMenu />
        <AdminUserCard user={user} className="border-0 bg-transparent px-2 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={adminBrand.signOut}
            title={adminBrand.signOut}
            isLoading={logout.isPending}
            onClick={() => logout.mutate()}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut />
          </Button>
        </AdminUserCard>
        <Link
          href="/"
          className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" />
          {adminBrand.backToSite}
        </Link>
      </div>
    </div>
  );
}
