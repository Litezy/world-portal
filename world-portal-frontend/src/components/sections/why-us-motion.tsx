"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";

const DESKTOP = "(min-width: 1024px)";
const COMPACT = "(max-width: 1023.98px)";

/** How long one word takes to ink, and how far apart the words start. */
const WORD = 0.5;
const STEP = 0.14;

/** The tilt each reason card settles out of, so the row lands like dealt cards. */
const SETTLE = [-3, 2.2, -1.6, 2.8];

/**
 * The motion layer for Why Us, around markup the server renders:
 *
 * - `[data-why-word]` in the statement ink in one by one as it scrolls
 *   through, scrubbed so scrolling back fades them out again; the gold
 *   marker under `[data-why-mark]` draws once its words have inked.
 * - `[data-why-reason]` cards settle into the row (rise, untilt, resolve).
 *
 * The server markup is the finished state, so with reduced motion (where
 * useGsap does nothing) every word is inked and every card is in place.
 */
export function WhyUsMotion({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;
    const statement = scope.querySelector<HTMLElement>("[data-why-statement]");
    const words = gsap.utils.toArray<HTMLElement>("[data-why-word]", scope);
    const mark = scope.querySelector<HTMLElement>("[data-why-mark]");
    const reasons = gsap.utils.toArray<HTMLElement>("[data-why-reason]", scope);
    const list = scope.querySelector<HTMLElement>("[data-why-reasons]");

    if (statement && words.length) {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: statement,
          start: "top 80%",
          end: "bottom 40%",
          scrub: 0.5,
        },
      });
      tl.fromTo(
        words,
        { opacity: 0.14 },
        { opacity: 1, duration: WORD, stagger: STEP },
        0,
      );
      if (mark) {
        // Starts as the last marked word finishes inking.
        const lastMarked = words.findLastIndex((w) => w.closest("[data-why-marked]"));
        tl.fromTo(
          mark,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.7, ease: "power2.out" },
          Math.max(0, lastMarked * STEP + WORD * 0.6),
        );
      }
    }

    if (!list || !reasons.length) return;
    const mm = gsap.matchMedia();
    const from = (i: number) => ({
      y: 72,
      rotation: SETTLE[i % SETTLE.length],
      autoAlpha: 0,
    });
    const to = { y: 0, rotation: 0, autoAlpha: 1, ease: "power3.out" };

    mm.add(DESKTOP, () => {
      reasons.forEach((card, i) => {
        gsap.fromTo(card, from(i), {
          ...to,
          scrollTrigger: {
            trigger: list,
            start: `top ${96 - i * 4}%`,
            end: `top ${62 - i * 4}%`,
            scrub: 0.6,
          },
        });
      });
    });

    mm.add(COMPACT, () => {
      reasons.forEach((card, i) => {
        gsap.fromTo(card, from(i), {
          ...to,
          scrollTrigger: {
            trigger: card,
            start: "top 98%",
            end: "top 70%",
            scrub: 0.6,
          },
        });
      });
    });
  }, []);

  return (
    <div ref={scopeRef as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </div>
  );
}
