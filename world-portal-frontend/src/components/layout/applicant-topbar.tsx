"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut, Menu, ShoppingBag, Sparkles, User, X } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { NotificationCenter } from "@/components/common/notification-center";
import { ApplicantNav } from "@/components/layout/applicant-nav";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useApplicantAuthStore } from "@/features/applicant/store/applicant-auth-store";
import { useBasketStore } from "@/features/basket/store";

export function ApplicantTopbar() {
  const [open, setOpen] = React.useState(false);

  const email = useApplicantAuthStore((s) => s.email);
  const profileId = useApplicantAuthStore((s) => s.profileId);
  const isAuthenticated = useApplicantAuthStore((s) => s.isAuthenticated);
  const logout = useApplicantAuthStore((s) => s.logout);

  const items = useBasketStore((s) => s.items);
  const monogram = email ? email.slice(0, 2).toUpperCase() : "AP";
  const name = email ? email.split("@")[0] : "Applicant";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-6">
        {/* Mobile navigation toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          <Drawer open={open} onOpenChange={setOpen} direction="left">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
                <Menu />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background text-foreground">
              <DrawerTitle className="sr-only">Applicant navigation</DrawerTitle>
              <div className="flex items-center justify-between border-b border-border/60 px-5 pt-5 pb-4">
                <Logo href="/applicant" tone="dark" />
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
                <ApplicantNav onNavigate={() => setOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
          <Logo href="/applicant" tone="dark" className="lg:hidden" />
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="font-semibold text-foreground">Applicant Portal</span>
          <span>·</span>
          <span>Welcome back, {name}</span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NotificationCenter recipientId={email || profileId} recipientType="APPLICANT" />
          <ThemeToggle />

          <Button asChild variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">
            <Link href="/">
              View site
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/hire">
              <Sparkles className="mr-1 size-3.5 text-primary" />
              Hire a Pro
            </Link>
          </Button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 border-l border-border/60 pl-3">
              <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                {monogram}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={logout}
                title="Sign out"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
