"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowUpRight, LogOut, Menu, Search, Settings, X } from "lucide-react";

import { UserAvatar } from "@/components/admin/user-avatar";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AgencyNav } from "@/components/layout/agency-nav";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { agencyAssignments } from "@/content/agency";
import { useAgencyLogout } from "@/features/agency/api/use-agency-auth";
import type { AgencyUser } from "@/features/agency/types";

export function AgencyTopbar({ user }: { user: AgencyUser }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const logout = useAgencyLogout();

  // ⌘K / Ctrl+K focuses search, exactly as in the console.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function submitSearch() {
    const term = query.trim();
    if (!term) return;
    router.push(`/agency/assignments?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-6">
        {/* Mobile navigation */}
        <div className="flex items-center gap-3 lg:hidden">
          <Drawer open={open} onOpenChange={setOpen} direction="left">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
                <Menu />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background text-foreground">
              <DrawerTitle className="sr-only">Agency navigation</DrawerTitle>
              <div className="flex items-center justify-between border-b border-border/60 px-5 pt-5 pb-4">
                <Logo href="/agency" tone="dark" />
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close navigation"
                    className="text-foreground hover:bg-muted/60"
                  >
                    <X />
                  </Button>
                </DrawerClose>
              </div>
              <div className="overflow-y-auto px-5 pt-6">
                <AgencyNav onNavigate={() => setOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
          <Logo href="/agency" tone="dark" className="lg:hidden" />
        </div>

        {/* Assignment search — the one list an agency looks things up in. */}
        <div className="relative hidden max-w-md flex-1 sm:flex">
          <div className="flex w-full items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors focus-within:border-primary focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 hover:bg-muted/80">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitSearch();
              }}
              placeholder={agencyAssignments.searchPlaceholder}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="hidden items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground sm:inline-flex"
          >
            <Link href="/">
              View site
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="rounded-full ring-offset-2 transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <UserAvatar user={user} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-[13px] font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.agencyName}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/agency/settings">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
