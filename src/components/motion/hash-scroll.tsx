"use client";

import * as React from "react";

import { ScrollTrigger } from "@/lib/motion/gsap";

/**
 * Makes deep links to an in-page anchor actually land there.
 *
 * `html { scroll-behavior: smooth }` breaks the browser's *initial* anchor
 * jump: the smooth scroll starts during load and is cancelled by the layout
 * shifts that follow, leaving the visitor at the top of the page with a hash
 * in the URL. Sharing `/#visas` would silently open the hero instead.
 *
 * So the jump is redone here, after two frames (layout settled) with an
 * explicit `instant` behaviour that overrides the CSS. ScrollTrigger is then
 * refreshed, because every trigger below the anchor has just moved.
 *
 * In-page clicks are untouched — those happen after load, where the CSS smooth
 * scroll is exactly what we want.
 */
export function HashScroll() {
  React.useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (!id) return;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "instant", block: "start" });
        ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return null;
}
