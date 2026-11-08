"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * The closing band's choreography: the page's eleventh beat, a kinetic close.
 *
 * Two scrubbed timelines, so the whole thing assembles as the visitor scrolls
 * in and comes apart again if they scroll back up:
 *
 * 1. the copy column — each word of the headline rises out of its own mask
 *    with a slight tilt (`[data-kinetic-word]`), the gold star lands after the
 *    last word (`[data-kinetic-star]`), then the supporting lines settle
 *    (`[data-kinetic-line]`);
 * 2. the card — it lifts into place (`[data-kinetic-card]`), then the service
 *    doors arrive one after another (`[data-kinetic-item]`).
 *
 * The card's timeline has its own trigger because on a phone it sits a whole
 * screen below the headline. Transforms and opacity only. The markup is the
 * assembled state, so reduced motion (where none of this is built) and a
 * visitor who lands on `/#start-here` past the end both see it whole.
 */
export function ContactKinetic({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;
    const q = gsap.utils.selector(scope);

    const copy = scope.querySelector<HTMLElement>("[data-kinetic-copy]");
    if (copy) {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: copy, start: "top 85%", end: "top 30%", scrub: 0.6 },
      });
      tl.from(q("[data-kinetic-word]"), {
        yPercent: 115,
        rotate: 5,
        transformOrigin: "0% 100%",
        duration: 0.6,
        stagger: 0.07,
      })
        .from(
          q("[data-kinetic-star]"),
          {
            scale: 0,
            rotate: -120,
            autoAlpha: 0,
            duration: 0.35,
            ease: "back.out(2.4)",
          },
          "-=0.15",
        )
        .from(
          // The heading's own supporting paragraph rides with the lines.
          [copy.querySelector("h2 + p"), ...q("[data-kinetic-line]")].filter(Boolean),
          { y: 26, autoAlpha: 0, duration: 0.5, stagger: 0.08 },
          "-=0.35",
        );
    }

    const card = scope.querySelector<HTMLElement>("[data-kinetic-card]");
    if (card) {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: card, start: "top 92%", end: "top 30%", scrub: 0.6 },
      });
      tl.from(card, { y: 70, autoAlpha: 0.2, duration: 0.5 }).from(
        q("[data-kinetic-item]"),
        {
          y: 26,
          scale: 0.94,
          autoAlpha: 0,
          duration: 0.35,
          stagger: 0.09,
        },
        "-=0.2",
      );
    }
  }, []);

  return (
    <div ref={scopeRef as React.Ref<HTMLDivElement>} className={cn(className)}>
      {children}
    </div>
  );
}

/**
 * A line of headline copy split into words, each in its own mask so it can
 * rise into place. The spaces stay real text between the masks, so the
 * heading reads as one sentence to a screen reader and wraps like one.
 */
export function KineticWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          {/* Padded and pulled back by the same amount, so the mask clears
              descenders and the italic's overhang without moving the line. */}
          <span className="-mx-[0.08em] -mb-[0.14em] inline-block overflow-hidden px-[0.08em] pb-[0.14em] align-bottom">
            <span data-kinetic-word="" className="inline-block">
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </>
  );
}
