"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { useMediaQuery } from "@/hooks/use-media-query";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * How far each column drifts across the section's pass through the viewport,
 * as a fraction of the viewport's height. Signs alternate, so neighbouring
 * columns slide past each other; magnitudes differ, so no two move alike.
 */
const COLUMN_DRIFT = [0.09, -0.07, 0.15, -0.04] as const;

/** The most a card leans while the page is moving fast, in degrees. */
const MAX_SKEW = 2;

/**
 * WorldSpace's wall as velocity columns: the page's ninth beat.
 *
 * The posts stay one grid (and one list, in reading order); what moves is the
 * column each post falls in. Every column drifts at its own speed and
 * direction as the section passes (scrubbed, so it rewinds), and every card
 * leans a little with the speed of the scroll and springs upright when the
 * page stops. Transforms only, applied to a wrapper inside each `<li>` (the
 * `[data-ws-drift]` child), so the card's own hover lift is left alone and
 * every card is still the plain outbound link the server rendered.
 *
 * Which column an item is in is just `index % columns`, the grid's own
 * auto-placement, so the breakpoints are read here and the motion is rebuilt
 * when they change. Below sm the wall is a swipeable row and nothing drifts;
 * under reduced motion it is the static, staggered grid.
 */
export function WorldSpaceColumns({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const sm = useMediaQuery("(min-width: 640px)");
  const lg = useMediaQuery("(min-width: 1024px)");
  const xl = useMediaQuery("(min-width: 1280px)");
  const columns = xl ? 4 : lg ? 3 : sm ? 2 : 1;

  const scopeRef = useGsap(
    ({ scope }) => {
      if (!scope || columns < 2) return;

      const items = (Array.from(scope.children) as HTMLElement[]).filter(
        (item) => getComputedStyle(item).display !== "none",
      );
      const drifters = items
        .map((item) => item.querySelector<HTMLElement>("[data-ws-drift]"))
        .filter((el): el is HTMLElement => el !== null);
      if (drifters.length === 0) return;

      for (let column = 0; column < columns; column++) {
        const targets = drifters.filter((_, index) => index % columns === column);
        const drift = COLUMN_DRIFT[column % COLUMN_DRIFT.length]!;

        gsap.fromTo(
          targets,
          { y: () => drift * window.innerHeight },
          {
            y: () => -drift * window.innerHeight,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      // Lean with the scroll's speed, then settle once it stops.
      const leans = drifters.map((el) =>
        gsap.quickTo(el, "skewY", { duration: 0.7, ease: "power3.out" }),
      );
      const lean = (deg: number) => leans.forEach((to) => to(deg));
      let settle: gsap.core.Tween | undefined;

      ScrollTrigger.create({
        trigger: scope,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          lean(gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, self.getVelocity() / -450));
          settle?.kill();
          settle = gsap.delayedCall(0.12, () => lean(0));
        },
        onLeave: () => lean(0),
        onLeaveBack: () => lean(0),
      });
    },
    [columns],
  );

  return (
    <ul ref={scopeRef as React.Ref<HTMLUListElement>} className={cn(className)}>
      {children}
    </ul>
  );
}
