"use client";

import { useEffect, useState } from "react";

type LandingScroll = {
  /** The hero's bottom edge has risen above the middle of the viewport. */
  pastHero: boolean;
  /** "How it works" (#journey) holds the middle of the screen. */
  inJourney: boolean;
  /** The site footer has come up into view, where its paper plane lands. */
  atFooter: boolean;
};

const START: LandingScroll = { pastHero: false, inJourney: false, atFooter: false };

/**
 * Where the landing page's scroll is, for Vivid's placement: the Ask Vivid
 * pill (md and up) and the corner orb (phones) both wait for the hero to go,
 * so neither sits on the paper plane, its arrival card or the calls to action.
 *
 * The hero pins its panel for a long scroll, so `scrollY` alone doesn't say
 * it has gone; its box does. Measured on scroll and resize, one frame at a
 * time. Pass `enabled = false` off the landing page: nothing is measured and
 * the result stays at its start.
 */
export function useLandingScroll(enabled = true): LandingScroll {
  const [view, setView] = useState<LandingScroll>(START);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const vh = window.innerHeight;
      // A box with no height has not been laid out yet (mid-hydration), and
      // must not read as "scrolled past".
      const hero = document.querySelector("[data-hero]")?.getBoundingClientRect();
      const pastHero =
        hero && hero.height > 0 ? hero.bottom < vh * 0.5 : window.scrollY > vh * 0.55;
      const journey = document.getElementById("journey")?.getBoundingClientRect();
      const inJourney = journey
        ? journey.top < vh * 0.6 && journey.bottom > vh * 0.4
        : false;
      const footer = document.querySelector("footer")?.getBoundingClientRect();
      const atFooter = footer ? footer.top < vh - 96 : false;
      setView((prev) =>
        prev.pastHero === pastHero &&
        prev.inJourney === inJourney &&
        prev.atFooter === atFooter
          ? prev
          : { pastHero, inJourney, atFooter },
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  return view;
}
