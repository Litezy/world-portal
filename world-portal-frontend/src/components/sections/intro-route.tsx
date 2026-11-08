"use client";

import * as React from "react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { intro } from "@/content/landing";
import { type IconName, IconTile } from "@/ds/components/icon";
import { TiltCard } from "@/ds/components/motion";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

type ThumbnailPosition = (typeof intro.thumbnails)[number]["position"];

/**
 * The four things the body copy lists, in the order they have to happen,
 * keyed to the photograph of that step.
 *
 * Each photograph sits on its own depth plane: `drift` is how far it travels
 * (in px, across the section's whole pass through the viewport), and a
 * larger drift reads as nearer. Neighbours alternate near and far so they
 * slide past one another rather than moving in lockstep, and the nearer
 * planes carry the deeper shadow. On desktop the frames still rise from left
 * to right, so the row climbs toward the trip itself.
 */
const STEPS: Record<
  ThumbnailPosition,
  { label: string; icon: IconName; frame: string; drift: number; shadow: string }
> = {
  "top-left": {
    label: "Passport",
    icon: "id-card",
    frame: "lg:aspect-[1/1]",
    drift: 36,
    shadow: "shadow-[0_18px_40px_-28px_rgb(8_20_50/0.45)]",
  },
  "top-right": {
    label: "Visa",
    icon: "certificate",
    frame: "lg:aspect-[9/10]",
    drift: 92,
    shadow: "shadow-[0_34px_70px_-34px_rgb(8_20_50/0.6)]",
  },
  "bottom-left": {
    label: "Flight",
    icon: "ticket",
    frame: "lg:aspect-[4/5]",
    drift: 52,
    shadow: "shadow-[0_24px_52px_-30px_rgb(8_20_50/0.5)]",
  },
  "bottom-right": {
    label: "Stay",
    icon: "building",
    frame: "lg:aspect-[7/10]",
    drift: 120,
    shadow: "shadow-[0_40px_80px_-36px_rgb(8_20_50/0.62)]",
  },
};

const DESKTOP = "(min-width: 1024px)";
const COMPACT = "(max-width: 1023.98px)";

/**
 * The route the intro describes (passport, visa, flight, stay) as four
 * photographs on separate depth planes, over a rail that draws itself from
 * one step to the next as you scroll, ending on a gold dot at the stay.
 *
 * Everything is scrubbed, so scrolling back up rewinds it. The markup is the
 * finished state (rail drawn, every node lit, planes at rest): with reduced
 * motion, or before the script runs, that is what shows.
 */
export function IntroRoute() {
  const last = intro.thumbnails.length - 1;

  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;
    const planes = gsap.utils.toArray<HTMLElement>("[data-intro-plane]", scope);
    const nodes = gsap.utils.toArray<HTMLElement>("[data-intro-node]", scope);
    const fills = gsap.utils.toArray<HTMLElement>("[data-intro-fill]", scope);
    const goal = scope.querySelector<HTMLElement>("[data-intro-goal]");
    const mm = gsap.matchMedia();

    const drift = (scale: number) => {
      planes.forEach((plane) => {
        const travel = Number(plane.dataset.introPlane) * scale;
        gsap.fromTo(
          plane,
          { y: travel / 2 },
          {
            y: -travel / 2,
            ease: "none",
            scrollTrigger: {
              trigger: scope,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.4,
            },
          },
        );
      });
    };

    mm.add(DESKTOP, () => {
      drift(1);

      // The rail: each segment draws in turn, and the node at its far end
      // lights as the line arrives. Ends on the gold dot at the stay.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: scope,
          start: "bottom 94%",
          end: "bottom 48%",
          scrub: 0.5,
        },
      });
      tl.fromTo(
        nodes[0] ?? [],
        { scale: 0.82, autoAlpha: 0.35 },
        { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)" },
      );
      fills.forEach((fill, i) => {
        tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 1 }).fromTo(
          nodes[i + 1] ?? [],
          { scale: 0.82, autoAlpha: 0.35 },
          { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)" },
          "-=0.08",
        );
      });
      if (goal) {
        tl.fromTo(
          goal,
          { scale: 0, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(3)" },
        );
      }
    });

    mm.add(COMPACT, () => {
      // Two columns: half the depth, and each step's node lights as its
      // photograph comes up the screen.
      drift(0.45);
      nodes.forEach((node) => {
        gsap.fromTo(
          node,
          { scale: 0.8, autoAlpha: 0.35 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: node,
              start: "top 96%",
              end: "top 72%",
              scrub: 0.5,
            },
          },
        );
      });
      if (goal) {
        gsap.fromTo(
          goal,
          { scale: 0, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: "back.out(3)",
            scrollTrigger: {
              trigger: goal,
              start: "top 92%",
              end: "top 76%",
              scrub: 0.5,
            },
          },
        );
      }
    });
  }, []);

  return (
    <ol
      ref={scopeRef as React.Ref<HTMLOListElement>}
      className={cn(
        "mt-12 grid grid-cols-2 gap-x-3 gap-y-9 sm:mt-16 sm:gap-x-4",
        "lg:mt-24 lg:grid-cols-4 lg:items-end lg:gap-x-5",
      )}
    >
      {intro.thumbnails.map((t, i) => {
        const step = STEPS[t.position];
        return (
          <li key={t.src} className={cn("group/photo flex min-w-0 flex-col")}>
            {/* The depth plane: drifts with the scroll at its own rate. */}
            <div data-intro-plane={step.drift} className={cn("relative z-[1]")}>
              {/* Hover lifts the photograph off its plane; the tilt follows the pointer. */}
              <div
                className={cn(
                  "transition-[translate] duration-500 ease-(--cx-spring)",
                  "motion-safe:group-hover/photo:-translate-y-2",
                )}
              >
                <TiltCard max={5} className={cn("relative rounded-card", step.shadow)}>
                  <div
                    className={cn(
                      "cx-lit relative overflow-hidden rounded-card [--cx-lit:#fff]",
                    )}
                  >
                    <ParallaxImage
                      src={t.src}
                      alt={t.alt}
                      fill
                      sizes="(min-width: 1024px) 285px, 46vw"
                      // Alternating strengths so neighbours never drift in lockstep.
                      strength={i % 2 === 0 ? 12 : 7}
                      className={cn("aspect-[4/5]", step.frame)}
                    />
                    <span className={cn("cx-lit-2")} aria-hidden="true" />
                  </div>
                </TiltCard>
              </div>
            </div>

            <div className={cn("mt-5 flex items-center gap-3 sm:mt-6 lg:mt-9")}>
              <span data-intro-node className={cn("inline-flex")}>
                <IconTile name={step.icon} variant="glass" size="sm" />
              </span>
              <p className={cn("min-w-0 leading-tight")}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block text-[11px] font-semibold tracking-[0.12em] text-text-3 tabular-nums",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "block text-[15px] font-semibold tracking-[-0.01em] text-foreground sm:text-[17px]",
                  )}
                >
                  {step.label}
                </span>
              </p>

              {i < last ? (
                // The rail runs on into the gap so the four read as one route;
                // its blue fill is what draws as you scroll.
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative ml-2 hidden h-px flex-1 overflow-hidden bg-hairline lg:-mr-5 lg:block",
                  )}
                >
                  <span
                    data-intro-fill
                    className={cn(
                      "absolute inset-0 origin-left bg-linear-to-r from-ember to-cyan-500",
                    )}
                  />
                </span>
              ) : (
                // Where the route ends: the one gold touch in this section.
                <span
                  data-intro-goal
                  aria-hidden="true"
                  className={cn(
                    "ml-1 size-2.5 shrink-0 rounded-full bg-gold shadow-[0_0_0_4px_var(--color-gold-wash)]",
                  )}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
