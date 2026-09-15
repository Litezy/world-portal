"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { hero } from "@/content/landing";
import { ApplicantLoginModal } from "@/features/applicant/components/applicant-login-modal";
import { useApplicantAuthStore } from "@/features/applicant/store/applicant-auth-store";
import { BasketButton } from "@/features/basket/components/basket-button";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

export type SiteHeaderProps = {
  /**
   * "overlay" starts transparent over the hero photograph and picks up a dark
   * glass bar once you scroll past it — the nav is white type, so it needs
   * something behind it before it reaches the light sections below.
   *
   * "solid" is for pages with no hero (apply, track, start): the same bar,
   * opaque from the first pixel.
   */
  variant?: "overlay" | "solid";
};

export function SiteHeader({ variant = "overlay" }: SiteHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);

  const isAuthenticated = useApplicantAuthStore((s) => s.isAuthenticated);
  const scrolled = useScroll(24);
  const filled = variant === "solid" || scrolled;

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setLoginModalOpen(true);
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500",
          filled &&
            "bg-ink-950/85 shadow-[0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <div className="relative mx-auto flex h-[72px] max-w-[1420px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-20 lg:px-12">
          <Logo markClassName="h-11 sm:h-14" className="shrink-0" />

          <nav
            aria-label="Main"
            className={cn(
              "hidden shrink items-center justify-center rounded-full p-1.5 transition-all duration-500 xl:flex",
              filled ? "bg-white/8" : "glass-dark",
            )}
          >
            <ul className="flex items-center">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex h-9 items-center rounded-full px-2.5 text-[12.5px] font-medium text-white/85 transition-colors duration-300 hover:bg-white/15 hover:text-white xl:px-3.5 2xl:px-4 2xl:text-[13px]"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <Button
              asChild
              variant="ghost"
              size="md"
              className="hidden text-white/90 hover:bg-white/10 hover:text-white xl:inline-flex"
            >
              <Link href="/applicant/applications" onClick={handleTrackClick}>
                Track application
              </Link>
            </Button>

            <ThemeToggle className="text-white/90 hover:bg-white/10 hover:text-white" />
            <BasketButton />
            <Button asChild variant="solid" size="md" className="hidden lg:inline-flex">
              <Link href={hero.navCta.href}>{hero.navCta.label}</Link>
            </Button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="text-white xl:hidden"
            >
              {open ? <X className="size-7" /> : <Menu className="size-7" />}
            </button>
          </div>
        </div>

        {/* Mobile sheet. Rendered always so it can animate, hidden from AT when shut. */}
        <div
          id="mobile-nav"
          hidden={!open}
          className="glass-dark mx-4 mb-4 rounded-3xl p-5 xl:hidden"
        >
          <ul className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
              <span className="text-sm font-medium text-white/80">Theme</span>
              <ThemeToggle className="text-white/90 hover:bg-white/10 hover:text-white" />
            </div>
            <Button
              asChild
              variant="outline"
              size="block"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Link
                href="/applicant/applications"
                onClick={(e) => {
                  setOpen(false);
                  handleTrackClick(e);
                }}
              >
                Track application
              </Link>
            </Button>
            <Button asChild variant="primary" size="block">
              <Link href={hero.navCta.href} onClick={() => setOpen(false)}>
                {hero.navCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <ApplicantLoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </>
  );
}
