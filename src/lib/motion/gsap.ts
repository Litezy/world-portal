"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single registration point. Importing gsap in more than one module is fine,
 * but `registerPlugin` must run once before any ScrollTrigger is created, and
 * only in the browser. Repeat calls are harmless; the module cache makes this
 * run once anyway.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  /**
   * ScrollTrigger measures the page when each trigger is created. Two things
   * routinely invalidate those measurements straight afterwards:
   *
   *  - Anchor navigation (landing on `/#contact`) jumps the scroll position
   *    after layout effects have already run.
   *  - Images finishing decode, which changes every offset below them.
   *
   * Without a refresh, a `once: true` reveal below the fold can be left holding
   * its `autoAlpha: 0` start state — content the visitor never sees. Refreshing
   * on load re-evaluates every trigger and fires any already scrolled past.
   */
  const refresh = () => ScrollTrigger.refresh();

  if (document.readyState === "complete") {
    requestAnimationFrame(refresh);
  } else {
    window.addEventListener("load", () => requestAnimationFrame(refresh), {
      once: true,
    });
  }
}

/** Matches the `--ease-glass` curve used by the CSS transitions. */
export const EASE = "power3.out";
export const EASE_GLASS = "expo.out";

export { gsap, ScrollTrigger };

/** True when the visitor has asked the OS to reduce motion. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
