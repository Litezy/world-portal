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
      // Brand yellow in both placements — it reads on the hero photograph and
      // on the black footer, so `tone` only shifts how much lift it needs.
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md text-primary focus-visible:outline-none",
        tone === "light" && "[text-shadow:0_1px_10px_rgba(8,10,14,0.45)]",
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
              d="M22.2 10.35 14.9 9.1l-3.62-6.3a.92.92 0 0 0-.8-.46h-1.2c-.4 0-.68.36-.6.74l1.2 5.62-3.6-.62-1.28-2.1a.6.6 0 0 0-.52-.29h-.7c-.36 0-.62.32-.56.66l.62 3.3-1.06.6a.62.62 0 0 0 0 1.1l1.06.6-.62 3.3c-.06.34.2.66.56.66h.7a.6.6 0 0 0 .52-.29l1.28-2.1 3.6-.62-1.2 5.62c-.08.38.2.74.6.74h1.2c.33 0 .64-.18.8-.46l3.62-6.3 7.3-1.25a.66.66 0 0 0 0-1.3Z"
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
