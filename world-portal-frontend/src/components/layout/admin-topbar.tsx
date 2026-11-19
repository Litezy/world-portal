"use client";

import * as React from "react";

import { Menu, Search } from "lucide-react";

import { AdminLogo, AppearanceMenu } from "@/components/admin/admin-palette";
import { CommandPalette } from "@/components/admin/command-palette";
import {
  AdminSidebarContent,
  OPEN_ADMIN_SEARCH,
} from "@/components/layout/admin-sidebar-content";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { adminBrand, commandPalette } from "@/content/admin";
import type { ClientAdminUser } from "@/types";

/**
 * Phones and tablets: a slim bar with the menu, the name and search. On
 * desktop the sidebar carries all of it, so the bar is hidden there — but it
 * stays mounted, because it owns the search palette and its ⌘K shortcut.
 */
export function AdminTopbar({ user }: { user: ClientAdminUser }) {
  const [navOpen, setNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    // ⌘K / Ctrl+K opens search from anywhere; so does the sidebar's search box.
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    const onOpen = () => setSearchOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_ADMIN_SEARCH, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_ADMIN_SEARCH, onOpen);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
          <Drawer open={navOpen} onOpenChange={setNavOpen} direction="left">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
                <Menu />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-sidebar text-foreground">
              <DrawerTitle className="sr-only">{adminBrand.navLabel}</DrawerTitle>
              <AdminSidebarContent
                user={user}
                onNavigate={() => setNavOpen(false)}
                onClose={() => setNavOpen(false)}
              />
            </DrawerContent>
          </Drawer>

          {/* Top-aligned, not centred: the logo image's middle is the swoosh,
              not the wordmark. With leading-none the tag's baseline sits
              9.75px down, on the wordmark's own baseline (9.7px of the 28px
              mark), so it reads as one line: E-EMBASSY ADMIN. */}
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <AdminLogo href="/admin" markClassName="h-7 sm:h-7" />
            <span className="text-[10.5px] leading-none font-semibold tracking-[0.16em] text-primary uppercase">
              {adminBrand.tag}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={commandPalette.label}
            onClick={() => setSearchOpen(true)}
          >
            <Search />
          </Button>
          <AppearanceMenu compact align="end" />
        </div>
      </header>

      <CommandPalette role={user.role} open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
