"use client";

import * as React from "react";
import Link from "next/link";

import { ArrowUpRight, LogOut, Menu, Settings, X } from "lucide-react";

import { UserAvatar } from "@/components/admin/user-avatar";
import { Logo } from "@/components/common/logo";
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
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <Drawer open={open} onOpenChange={setOpen} direction="left">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
                <Menu />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-ink-950 text-white">
              <DrawerTitle className="sr-only">Console navigation</DrawerTitle>
              <div className="flex items-center justify-between px-5 pt-5">
                <Logo href="/admin" />
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close navigation"
                    className="text-white hover:bg-white/10"
                  >
                    <X />
                  </Button>
                </DrawerClose>
              </div>
              <div className="px-5 pt-8">
                <AdminNav onNavigate={() => setOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
          <Logo href="/admin" tone="dark" className="lg:hidden" />
        </div>

        <div className="ml-auto flex items-center gap-2">
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
                className="rounded-full ring-offset-2 transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
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
