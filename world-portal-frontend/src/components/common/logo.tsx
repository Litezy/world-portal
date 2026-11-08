import { useId } from "react";
import Link from "next/link";

import {
  EDGE_LOWER,
  EDGE_UPPER,
  WING_LOWER,
  WING_UPPER,
} from "@/components/common/logo-geometry";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Logo artwork only: the thin edges are not UI colours (see globals.css). */
const EDGE_RED = "#E3262E";
const EDGE_GOLD = "#F5B82E";

/** The lockup's viewBox: the mark scaled to 100 high, then the wordmark. */
const VIEWBOX_WIDTH = 496;
const MARK_SCALE = 100 / 404;

/**
 * Gradients for the mark, under ids unique to each Logo. A shared id is NOT
 * harmless: the browser resolves url(#id) to the first element with that id
 * in the document, and when that copy sits in a hidden subtree (the admin
 * login renders a second, display:none logo) the gradient paints nothing and
 * the wings vanish.
 */
function MarkDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient
        id={`${id}-upper`}
        x1="0"
        y1="0"
        x2="880"
        y2="150"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" style={{ stopColor: "var(--brand-500)" }} />
        <stop offset="0.55" style={{ stopColor: "var(--brand-600)" }} />
        <stop offset="1" style={{ stopColor: "var(--brand-800)" }} />
      </linearGradient>
      <linearGradient
        id={`${id}-lower`}
        x1="520"
        y1="120"
        x2="800"
        y2="404"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" style={{ stopColor: "var(--cyan-400)" }} />
        <stop offset="1" style={{ stopColor: "var(--cyan-500)" }} />
      </linearGradient>
      {/* The fold: a soft shadow where the cyan wing leaves the blue one. */}
      <linearGradient
        id={`${id}-fold`}
        x1="700"
        y1="70"
        x2="640"
        y2="200"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" style={{ stopColor: "var(--brand-800)", stopOpacity: 0.55 }} />
        <stop offset="1" style={{ stopColor: "var(--brand-800)", stopOpacity: 0 }} />
      </linearGradient>
    </defs>
  );
}

function Mark({ id }: { id: string }) {
  return (
    <>
      {/* Lower (cyan) wing first, so the blue wing overlaps it. */}
      <path d={WING_LOWER} fill={`url(#${id}-lower)`} />
      <path d={WING_LOWER} fill={`url(#${id}-fold)`} />
      <path d={EDGE_LOWER} fill={EDGE_GOLD} />
      <path d={WING_UPPER} fill={`url(#${id}-upper)`} />
      <path d={EDGE_UPPER} fill={EDGE_RED} />
    </>
  );
}

/**
 * The E-Embassy lockup: the mark, the wordmark in Manrope (the design
 * system's face) and the "by worldstreet" endorsement.
 *
 * One inline SVG, so it is sharp at every size and the type is live text in
 * the page's own font. Height comes from `markClassName`, and the width
 * follows from the viewBox. `tone` sets the type colour only: the wings are
 * the same everywhere. Deliberately static: it sits in the fixed header on
 * every page.
 */
export function Logo({
  className,
  markClassName,
  href = "/",
  tone = "light",
}: {
  /** Applied to the outer link — layout/visibility only (e.g. "lg:hidden"). */
  className?: string;
  /** Overrides the lockup's height classes (default "h-8 sm:h-9"). Width
   * always follows from the fixed aspect ratio — never set a width class
   * alongside this. */
  markClassName?: string;
  href?: string;
  /** "light" = for dark backgrounds and photography (white type).
   * "dark" = for the page background (follows the theme's foreground). */
  tone?: "light" | "dark";
  /** Kept for callers written against the old raster logo. No effect: the
   * logo is inline SVG, so there is nothing to preload. */
  priority?: boolean;
}) {
  const light = tone === "light";
  // useId's characters are not all valid in a url(#…) fragment.
  const id = `ee-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <Link
      href={href}
      aria-label={siteConfig.name}
      className={cn(
        "inline-flex items-center rounded-md focus-visible:outline-none",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} 100`}
        aria-hidden="true"
        focusable="false"
        overflow="visible"
        className={cn(
          "block h-8 w-auto sm:h-9",
          light ? "text-white" : "text-foreground",
          markClassName,
        )}
      >
        <MarkDefs id={id} />
        <g transform={`scale(${MARK_SCALE})`}>
          <Mark id={id} />
        </g>
        <text
          x="236"
          y="47"
          className="font-sans"
          fontWeight={800}
          fontSize={44}
          letterSpacing={0.4}
          fill="currentColor"
        >
          {siteConfig.name.toUpperCase()}
        </text>
        <text
          x="237"
          y="79"
          className="font-sans"
          fontWeight={600}
          fontSize={21}
          letterSpacing={0.2}
        >
          <tspan fill="currentColor" fillOpacity={0.62}>
            by{" "}
          </tspan>
          {/* WorldStreet's gold: the parent brand's colour, in its own name
              only. Deep on light, bright on dark, so it reads on both. */}
          <tspan
            className={
              light ? "fill-yellow-400" : "fill-yellow-600 dark:fill-yellow-500"
            }
          >
            {siteConfig.parent.toLowerCase()}
          </tspan>
        </text>
      </svg>
    </Link>
  );
}
