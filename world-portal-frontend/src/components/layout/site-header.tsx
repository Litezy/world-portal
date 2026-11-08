"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { mainNav } from "@/config/navigation";
import { hero } from "@/content/landing";
import { Icon } from "@/ds/components/icon";
import { WorldStreetSignInDialog } from "@/features/applicant/components/worldstreet-sign-in-dialog";
import { useApplicantSession } from "@/features/applicant/hooks/use-applicant-session";
import { BasketButton } from "@/features/basket/components/basket-button";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

export type SiteHeaderProps = {
  /**
   * "overlay" starts as lighter glass over the hero's sky and thickens once
   * you scroll, so its type keeps its contrast over the sections below.
   *
   * "solid" is for pages with no hero (apply, track, hire): the same bar,
   * thick from the first pixel.
   */
  variant?: "overlay" | "solid";
};

/** Quiet links inside the glass: the theme's ink, a soft fill on hover. */
const quietLink = cn(
  "inline-flex h-10 items-center rounded-pill px-2.5 text-sm font-medium whitespace-nowrap text-foreground/75 2xl:px-3",
  "transition-colors duration-200 ease-cx hover:bg-foreground/8 hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
);

/**
 * The site header is the design system's liquid nav: one floating capsule of
 * glass (`.cx-liquid`, in the `.cx-liquid-bar` layout) that holds the logo,
 * the section links and the actions, so nothing floats loose over the
 * photograph. The glass follows the theme: frosted white with ink type in
 * light (the default), smoked with white type in dark. Nothing in it is a
 * fixed white. The one primary action is the blue pill at the end;
 * everything else in the capsule is quiet. Below `xl` the links fold into a
 * menu, and the capsule itself opens into the sheet rather than stacking a
 * second panel of glass under it.
 *
 * It carries `data-brand="e-embassy"` itself because the (app) pages do not
 * sit inside the landing page's brand wrapper, and the primary pill must be
 * E-Embassy blue on those pages too.
 */
export function SiteHeader({ variant = "overlay" }: SiteHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);

  const { isAuthenticated } = useApplicantSession();
  // Only a page link (/hire) can be current; the section links are anchors.
  const pathname = usePathname();
  const scrolled = useScroll(24);
  const filled = variant === "solid" || scrolled;
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  // Escape shuts the open menu and hands focus back to its toggle, as it
  // does for every other overlay on the site.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setLoginModalOpen(true);
    }
  };

  return (
    <>
      <header
        data-brand="e-embassy"
        // The header box spans the viewport but only the capsule takes the
        // pointer, so the gutters either side of it never block the page.
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6 lg:pt-4",
        )}
      >
        <div
          className={cn(
            "cx-liquid pointer-events-auto mx-auto max-w-[1200px] text-foreground",
            "transition-[background-color,box-shadow] duration-500 ease-cx",
            open ? "rounded-[1.75rem]" : "rounded-pill",
            // Lighter over the hero, but never clear, so the links never sit on
            // bare sky. Thicker once it is over the page (or open as a menu).
            // The lift stays soft on a light page and deepens on a dark one.
            filled || open
              ? "[--cx-glass-alpha:0.88] [--cx-glass-shadow:0.2] dark:[--cx-glass-shadow:0.32]"
              : "[--cx-glass-alpha:0.72]",
          )}
        >
          <div
            className={cn(
              "cx-liquid-bar h-14 gap-3 py-0 pr-2 pl-4 sm:pl-5 lg:h-16 lg:pr-2.5 xl:pl-6",
            )}
          >
            <Logo
              tone="dark"
              markClassName="h-9 lg:h-10"
              className={cn("shrink-0 focus-visible:ring-2 focus-visible:ring-ring")}
            />

            <nav aria-label="Main" className={cn("hidden xl:block")}>
              <ul className={cn("flex items-center gap-0.5")}>
                {mainNav.map((item) => {
                  const current = item.href === pathname;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          quietLink,
                          current && "bg-foreground/10 text-foreground",
                        )}
                      >
                        {item.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className={cn("flex shrink-0 items-center gap-1")}>
              <Link
                href="/applicant/applications"
                onClick={handleTrackClick}
                className={cn(quietLink, "hidden xl:inline-flex")}
              >
                Track application
              </Link>

              <span
                aria-hidden="true"
                className={cn("mx-1.5 hidden h-5 w-px bg-foreground/15 xl:block")}
              />

              <ThemeToggle
                className={cn(
                  "hidden size-10 rounded-full px-0 text-foreground/75 hover:bg-foreground/8 hover:text-foreground xl:inline-flex",
                  // Icon-only in the capsule: the label stays for screen
                  // readers, and the glyph takes the bar's ink.
                  "[&_svg]:size-4.5 [&_svg]:text-current [&>span]:sr-only",
                )}
              />
              <BasketButton
                className={cn("text-foreground/85 hover:bg-foreground/8")}
              />

              <Link
                href={hero.navCta.href}
                className={cn(
                  "cx-btn cx-btn--sm ml-1.5 hidden h-10 px-5 font-medium sm:inline-flex lg:h-11 lg:px-6",
                )}
              >
                {hero.navCta.label}
              </Link>

              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                className={cn(
                  "grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-foreground/8 xl:hidden",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                )}
              >
                <Icon name={open ? "close" : "menu"} tone="current" size={22} />
              </button>
            </div>
          </div>

          {/* The menu opens inside the capsule. Rendered always, hidden from AT
              when shut. */}
          <div
            id="mobile-nav"
            hidden={!open}
            className={cn(
              "max-h-[calc(100svh-6rem)] overflow-y-auto px-2 pb-2 xl:hidden",
            )}
          >
            <ul className={cn("flex flex-col gap-0.5 pt-1")}>
              {mainNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={item.href === pathname ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center justify-between rounded-2xl px-4 text-base font-medium text-foreground/85",
                      "transition-colors hover:bg-foreground/8 hover:text-foreground",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      item.href === pathname && "bg-foreground/8 text-foreground",
                    )}
                  >
                    {item.title}
                    <Icon
                      name="chevron-right"
                      tone="current"
                      size={16}
                      className={cn("text-foreground/35")}
                    />
                  </a>
                </li>
              ))}
            </ul>

            <div
              className={cn(
                "mt-2 flex items-center justify-between rounded-2xl bg-foreground/5 py-1.5 pr-1.5 pl-4",
              )}
            >
              <span className={cn("text-sm font-medium text-foreground/70")}>
                Theme
              </span>
              <ThemeToggle
                className={cn(
                  "h-9 rounded-full text-foreground/85 hover:bg-foreground/8 hover:text-foreground [&_svg]:text-current",
                )}
              />
            </div>

            <div className={cn("mt-2 grid gap-2 sm:grid-cols-2")}>
              <Link
                href="/applicant/applications"
                onClick={(e) => {
                  setOpen(false);
                  handleTrackClick(e);
                }}
                className={cn(
                  "cx-btn cx-btn--block bg-foreground/8 font-medium text-foreground hover:bg-foreground/12 hover:shadow-none",
                )}
              >
                Track application
              </Link>
              <Link
                href={hero.navCta.href}
                onClick={() => setOpen(false)}
                className={cn("cx-btn cx-btn--block font-medium")}
              >
                {hero.navCta.label}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <WorldStreetSignInDialog
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        returnTo="/applicant/applications"
      />
    </>
  );
}
