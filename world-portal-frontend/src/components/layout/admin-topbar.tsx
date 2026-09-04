"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowRight, ArrowUpRight, BookUser, FileCheck2, LogOut, Menu, Search, Settings, Users, X } from "lucide-react";

import { UserAvatar } from "@/components/admin/user-avatar";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AdminNav } from "@/components/layout/admin-nav";

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
import { useLogout } from "@/features/auth/api/use-logout";
import type { AdminUser } from "@/types";

export function AdminTopbar({ user }: { user: AdminUser }) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const logout = useLogout();

  // Keyboard shortcut: ⌘K or Ctrl+K to focus search bar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowResults(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to dismiss instant search results popover
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    setShowResults(false);
    router.push(`/admin/applications?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-6">
        {/* Mobile Navigation Drawer Trigger */}
        <div className="flex items-center gap-3 lg:hidden">
          <Drawer open={open} onOpenChange={setOpen} direction="left">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
                <Menu />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background text-foreground">
              <DrawerTitle className="sr-only">Console navigation</DrawerTitle>
              <div className="flex items-center justify-between px-5 pt-5 border-b border-border/60 pb-4">
                <Logo href="/admin" tone="dark" />
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
              <div className="px-5 pt-6 overflow-y-auto">
                <AdminNav onNavigate={() => setOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
          <Logo href="/admin" tone="dark" className="lg:hidden" />
        </div>

        {/* Global Instant Search Bar & Command Dropdown */}
        <div ref={searchContainerRef} className="relative hidden sm:flex flex-1 max-w-md">
          <div className="flex w-full items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/80 focus-within:border-primary focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20">

            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search applications, passports, applicants..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(searchQuery);
                }
              }}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Floating Live Search Results Popover */}
          {showResults && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full rounded-2xl border border-border/80 bg-background/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95">
              <div className="flex flex-col gap-1 text-xs">
                {/* Category Header */}
                <p className="px-3 pt-2 pb-1 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Navigation
                </p>

                {/* Direct Jump to Visa Applications */}
                <button
                  type="button"
                  onClick={() => handleSearchSubmit(searchQuery)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted/60 transition-colors"

                >
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileCheck2 className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      Search Visas for &quot;<span className="text-primary font-semibold">{searchQuery}</span>&quot;
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">Filter applications by name or ref</p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </button>

                {/* Direct Jump to Passport Applications */}
                <button
                  type="button"
                  onClick={() => {
                    setShowResults(false);
                    router.push(`/admin/passports?q=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted/60 transition-colors"

                >
                  <span className="grid size-7 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
                    <BookUser className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      Search Passports for &quot;<span className="text-purple-600 font-semibold">{searchQuery}</span>&quot;
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">Filter passport requests by NIN or name</p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </button>

                {/* Direct Jump to Applicants CRM */}
                <button
                  type="button"
                  onClick={() => {
                    setShowResults(false);
                    router.push(`/admin/customers?q=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted/60 transition-colors"

                >
                  <span className="grid size-7 place-items-center rounded-lg bg-cyan-500/10 text-cyan-600">
                    <Users className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      Search Applicants for &quot;<span className="text-cyan-600 font-semibold">{searchQuery}</span>&quot;
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">Find applicant profiles by email or phone</p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Action Bar */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme Toggle (Light / Dark / System) */}
          <ThemeToggle />

          {/* View Public Site Link */}
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


          {/* User Account Menu */}
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
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
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
