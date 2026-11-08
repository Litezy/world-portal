"use client";

import * as React from "react";

import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * The list that turns Experiences' cards into a deck.
 *
 * The stacking itself is CSS: every `<li>` is `position: sticky` at a top a
 * few pixels lower than the one before, so each card slides up over the last
 * and the earlier ones leave a sliver showing. No pin, no scroll hijack.
 *
 * What GSAP adds, scrubbed so it rewinds on the way back up: as card n+1
 * travels from the bottom of the viewport to its resting place, card n eases
 * back (scale) and dims (a shade's opacity), and card n+1's photograph settles
 * from a slight zoom. Transforms and opacity only.
 *
 * The triggers are measured from the list (which is not sticky) plus each
 * card's natural offset, never from the sticky `<li>` itself: a stuck element
 * reports where it is stuck, not where it sits in the flow, and ScrollTrigger
 * would measure the wrong scroll range whenever a refresh landed mid-stack.
 *
 * The cards are rendered by the (server) section and passed in as children;
 * this component only owns the list element and the motion. Each card marks
 * its parts with `data-stack-card`, `data-stack-shade` and `data-stack-image`.
 */
export function ExperiencesStack({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;
    const items = Array.from(scope.children) as HTMLElement[];
    if (items.length < 2) return;

    // Where each item sits in the flow, measured from the list's own top.
    const naturalTop = (index: number) => {
      let y = 0;
      for (let i = 0; i < index; i++) {
        const item = items[i]!;
        y += item.offsetHeight + parseFloat(getComputedStyle(item).marginBottom);
      }
      return y;
    };
    const listTop = () => scope.getBoundingClientRect().top + window.scrollY;
    const stickyTop = (item: HTMLElement) =>
      parseFloat(getComputedStyle(item).top) || 0;

    items.forEach((item, index) => {
      const next = items[index + 1];
      const card = item.querySelector<HTMLElement>("[data-stack-card]");
      const shade = item.querySelector<HTMLElement>("[data-stack-shade]");
      if (!next || !card) return;
      const nextImage = next.querySelector<HTMLElement>("[data-stack-image]");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          start: () => listTop() + naturalTop(index + 1) - window.innerHeight,
          end: () => listTop() + naturalTop(index + 1) - stickyTop(next),
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });
      tl.to(card, { scale: 0.92, transformOrigin: "50% 0%" }, 0);
      if (shade) tl.to(shade, { opacity: 0.5 }, 0);
      if (nextImage) tl.fromTo(nextImage, { scale: 1.14 }, { scale: 1 }, 0);
    });
  }, []);

  return (
    <ol ref={scopeRef as React.Ref<HTMLOListElement>} className={cn(className)}>
      {children}
    </ol>
  );
}

/**
 * The last word of Experiences' heading, with the section's one gold touch: a
 * marker stroke under it that is drawn in (a `clip-path` wipe, scrubbed) as
 * the heading comes up the screen. Under reduced motion it is simply there.
 */
export function ExperiencesMarker({ children }: { children: React.ReactNode }) {
  const strokeRef = React.useRef<SVGSVGElement>(null);

  const scopeRef = useGsap(({ scope }) => {
    const stroke = strokeRef.current;
    if (!scope || !stroke) return;

    gsap.fromTo(
      stroke,
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: scope,
          start: "top 88%",
          end: "top 55%",
          scrub: 0.5,
        },
      },
    );
  }, []);

  return (
    <span
      ref={scopeRef as React.Ref<HTMLSpanElement>}
      className="relative isolate inline-block whitespace-nowrap"
    >
      <svg
        ref={strokeRef}
        aria-hidden="true"
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.08em] left-[-2%] -z-10 h-[0.32em] w-[104%] text-gold"
      >
        <path
          d="M3 11.5C38 6.2 80 4.6 118 5.4c28 .6 52 2.4 79 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      {children}
    </span>
  );
}
