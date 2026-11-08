"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

export type AgencyFigure = {
  value: number;
  label: string;
  /** The one gold numeral on the band. */
  gold?: boolean;
};

/** Two full turns of 0–9, so every digit rolls through a loop before landing. */
const STRIP = Array.from({ length: 20 }, (_, i) => i % 10);

/**
 * The key numbers under Agency's pitch, settling in like an odometer: each
 * digit is a strip of 0–9 twice over that rolls up and lands on its value as
 * the row comes up the screen. Scrubbed, so it rolls back on the way up.
 *
 * The resting markup is the landed state — the strip's base transform is the
 * final digit — so reduced motion and a not-yet-hydrated page both read the
 * real number. The strips are hidden from assistive tech; each figure's value
 * is also in the text as a visually hidden span, so it is read as "10, Kinds
 * of team you can list", not as forty digits.
 */
export function AgencyFigures({
  figures,
  className,
}: {
  figures: readonly AgencyFigure[];
  className?: string;
}) {
  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;
    const strips = Array.from(scope.querySelectorAll<HTMLElement>("[data-digit]"));

    strips.forEach((strip, index) => {
      const digit = Number(strip.dataset.digit);
      gsap.fromTo(
        strip,
        // y is pinned to 0 both ends: GSAP would otherwise read the resting
        // inline translate as a pixel offset and add the roll on top of it.
        { y: 0, yPercent: 0 },
        {
          y: 0,
          yPercent: landedPercent(digit),
          ease: "power3.out",
          scrollTrigger: {
            trigger: scope,
            // Later digits start a touch later, so a number settles left to
            // right rather than all at once.
            start: `top ${92 - index * 3}%`,
            end: "top 52%",
            scrub: 0.6,
          },
        },
      );
    });
  }, []);

  return (
    <dl
      ref={scopeRef as React.Ref<HTMLDListElement>}
      className={cn("grid gap-6 sm:grid-cols-3 sm:gap-0", className)}
    >
      {figures.map((figure) => (
        <div
          key={figure.label}
          className="flex flex-col-reverse gap-3 border-hairline sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0"
        >
          <dt className="max-w-[16rem] text-[14px] leading-snug text-muted-foreground">
            {figure.label}
          </dt>
          <dd
            className={cn(
              "flex text-[56px] leading-none font-semibold tracking-[-0.05em] tabular-nums sm:text-[64px] lg:text-[76px]",
              figure.gold ? "text-gold-ink" : "text-foreground",
            )}
          >
            <span className="sr-only">{figure.value}</span>
            {String(figure.value)
              .split("")
              .map((char, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="relative inline-block h-[1em] overflow-hidden"
                >
                  <span
                    data-digit={char}
                    className="flex flex-col"
                    style={{ transform: `translateY(${landedPercent(Number(char))}%)` }}
                  >
                    {STRIP.map((n, k) => (
                      <span key={k} className="block h-[1em] leading-[1em]">
                        {n}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The strip's offset when `digit` in its second loop is showing. */
function landedPercent(digit: number) {
  return -((10 + digit) / STRIP.length) * 100;
}
