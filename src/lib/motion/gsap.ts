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
