import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
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
 * The mark is deliberately static. It sits in the fixed header on every page,
 * so anything that moves here moves in the corner of the eye for the whole
 * session — the swoosh already reads as motion standing still.
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
  return (
    <Link
      href={href}
      aria-label={siteConfig.name}
      className={cn(
        "inline-flex items-center rounded-md focus-visible:outline-none",
        className,
      )}
    >
      <span className={cn("block h-8 sm:h-9", markClassName)}>
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
    </Link>
  );
}
