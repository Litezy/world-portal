"use client";

import * as React from "react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * The wordmark, with a plane that periodically takes off to the upper right,
 * loops away, and re-enters from the lower left back onto its pad. The dashed
 * arc behind it draws on departure and erases on arrival.
 *
 * Only the plane moves — the type never shifts, so the header never reflows.
 */
export function Logo({
  className,
  href = "/",
  tone = "light",
}: {
  className?: string;
  href?: string;
  /** "light" = white type, for photographic backgrounds. */
  tone?: "light" | "dark";
}) {
  const planeRef = React.useRef<SVGGElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);

  const scopeRef = useGsap(() => {
    const plane = planeRef.current;
    const path = pathRef.current;
    if (!plane || !path) return;

    const dash = path.getTotalLength();
    gsap.set(path, { strokeDasharray: dash, strokeDashoffset: dash });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 2.2 });

    tl
      // Taxi back a touch, then climb away to the upper right.
      .to(plane, { x: -3, y: 1, duration: 0.35, ease: "power2.in" })
      .to(path, { strokeDashoffset: 0, duration: 0.75, ease: "power2.out" }, "<0.1")
      .to(
        plane,
        { x: 34, y: -20, rotate: -18, opacity: 0, duration: 0.75, ease: "power2.in" },
        "<",
      )
      // Reset off-screen to the lower left, then fly back onto the pad.
      .set(plane, { x: -30, y: 18, rotate: -18 })
      .to(path, { strokeDashoffset: -dash, duration: 0.55, ease: "power1.inOut" })
      .to(
        plane,
        { x: 0, y: 0, rotate: 0, opacity: 1, duration: 0.85, ease: "power2.out" },
        "<0.05",
      )
      .set(path, { strokeDashoffset: dash });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <Link
      href={href}
      aria-label={siteConfig.name}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none",
        tone === "light" ? "text-white" : "text-ink-900",
        className,
      )}
    >
      <span
        ref={scopeRef as React.Ref<HTMLSpanElement>}
        className="relative block size-6 shrink-0"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-full overflow-visible">
          {/* Flight path */}
          <path
            ref={pathRef}
            d="M3 19C7 19 9.5 15 12 11.5S18 5 21 4.5"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeDasharray="2 3"
            opacity="0.5"
          />
          <g ref={planeRef}>
            <path
              d="M21.4 3.2 13.1 9.6l-4.4-1.4a1 1 0 0 0-.95.24L5.9 10.3a.6.6 0 0 0 .2 1l3.9 1.35 1.35 3.9a.6.6 0 0 0 1 .2l1.86-1.86a1 1 0 0 0 .24-.95l-1.4-4.4 6.4-8.3a.55.55 0 0 0-.05-.04Z"
              fill="currentColor"
            />
          </g>
        </svg>
      </span>

      <span className="font-logo text-[19px] leading-none font-semibold tracking-[-0.015em] whitespace-nowrap">
        {siteConfig.name}
      </span>
    </Link>
  );
}
