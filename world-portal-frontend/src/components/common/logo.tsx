"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/** Intrinsic size of the trimmed asset, used to hold the aspect ratio. */
const LOGO = { width: 1772, height: 406 } as const;

/**
 * The E-Embassy mark.
 *
 * Two files rather than a CSS filter: the wordmark is near-black and would
 * disappear on the hero photograph and the black footer, and a filter that
 * lifted it would also flatten the blue, cyan and gold of the swoosh. The
 * light variant recolours only the type.
 *
 * The swoosh lifts and settles on an interval — the mark already reads as
 * motion, so it only needs a nudge rather than an animation of its own.
 */
export function Logo({
  className,
  markClassName,
  href = "/",
  tone = "light",
  priority = false,
}: {
  /** Applied to the outer link — layout/visibility only (e.g. "lg:hidden"). */
  className?: string;
  /** Overrides the mark's height classes (default "h-8 sm:h-9"). Width
   * always follows from the fixed aspect ratio — never set a width class
   * alongside this. */
  markClassName?: string;
  href?: string;
  /** "light" = for dark backgrounds (white type). */
  tone?: "light" | "dark";
  priority?: boolean;
}) {
  const markRef = React.useRef<HTMLSpanElement>(null);

  const scopeRef = useGsap(() => {
    const mark = markRef.current;
    if (!mark) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 5, delay: 2.5 });
    tl.to(mark, { y: -2, rotate: -1.5, duration: 0.5, ease: "power2.out" }).to(mark, {
      y: 0,
      rotate: 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.55)",
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <Link
      href={href}
      aria-label={siteConfig.name}
      className={cn(
        "inline-flex items-center rounded-md focus-visible:outline-none",
        className,
      )}
    >
      <span
        ref={scopeRef as React.Ref<HTMLSpanElement>}
        className={cn("block h-8 sm:h-9", markClassName)}
      >
        <span ref={markRef} className="block h-full will-change-transform">
          <Image
            src={tone === "light" ? "/images/logo-light.png" : "/images/logo.png"}
            alt=""
            width={LOGO.width}
            height={LOGO.height}
            priority={priority}
            sizes="240px"
            className="h-full w-auto"
          />
        </span>
      </span>
    </Link>
  );
}
