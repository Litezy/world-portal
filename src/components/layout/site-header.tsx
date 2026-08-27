"use client";

import * as React from "react";
import Link from "next/link";

import { Menu, X } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { hero } from "@/content/landing";

/**
 * Sits over the hero image — logo left, glass nav pill centred, CTA right —
 * and scrolls away with it. Absolute rather than fixed: its type is white for
 * photography, so pinning it would leave it illegible over the light sections
 * below (and the reference design scrolls it away too).
 */
export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[72px] max-w-[1420px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-20 lg:px-12">
        <Logo />

        <nav
          aria-label="Main"
          className="glass-dark absolute left-1/2 hidden -translate-x-1/2 rounded-full p-1.5 lg:flex"
        >
          <ul className="flex items-center">
            {mainNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-white/85 transition-colors duration-300 hover:bg-white/15 hover:text-white"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="solid" size="md" className="hidden lg:inline-flex">
            <Link href={hero.navCta.href}>{hero.navCta.label}</Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-white lg:hidden"
          >
            {open ? <X className="size-7" /> : <Menu className="size-7" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet. Rendered always so it can animate, hidden from AT when shut. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="glass-dark mx-4 mb-4 rounded-3xl p-5 lg:hidden"
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
        <Button asChild variant="primary" size="block" className="mt-4">
          <Link href={hero.navCta.href} onClick={() => setOpen(false)}>
            {hero.navCta.label}
          </Link>
        </Button>
      </div>
    </header>
  );
}
