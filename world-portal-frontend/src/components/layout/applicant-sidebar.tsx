"use client";

import Link from "next/link";
import { ArrowUpRight, LogOut, User } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { ApplicantNav } from "@/components/layout/applicant-nav";
import { Button } from "@/components/ui/button";
import { useApplicantAuthStore } from "@/features/applicant/store/applicant-auth-store";

export function ApplicantSidebar() {
  const email = useApplicantAuthStore((s) => s.email);
  const isAuthenticated = useApplicantAuthStore((s) => s.isAuthenticated);
  const logout = useApplicantAuthStore((s) => s.logout);

  const monogram = email ? email.slice(0, 2).toUpperCase() : "AP";
  const name = email ? email.split("@")[0] : "Applicant";

  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-border/60 bg-background/95 px-5 py-6 text-foreground backdrop-blur-2xl lg:flex">
      <div className="flex items-center justify-between gap-2">
        <Logo href="/" tone="dark" />
        <span
          title="Applicant Console"
          className="max-w-[110px] truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary"
        >
          Applicant Desk
        </span>
      </div>

      <div className="mt-8 flex-1 overflow-y-auto pr-1">
        <ApplicantNav />
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View live site
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        {isAuthenticated ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                {monogram}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground capitalize">
                  {name}
                </p>
                <p className="truncate text-[11px] font-medium text-muted-foreground">
                  Applicant
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="mt-1 text-muted-foreground hover:text-destructive text-[11.5px]"
              onClick={logout}
              leftIcon={<LogOut className="size-3" />}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/50 p-3 text-center">
            <p className="text-[12px] font-medium text-muted-foreground">Guest User</p>
          </div>
        )}
      </div>
    </aside>
  );
}
