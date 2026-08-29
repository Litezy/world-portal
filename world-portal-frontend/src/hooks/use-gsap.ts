"use client";

import * as React from "react";

import { gsap, prefersReducedMotion } from "@/lib/motion/gsap";

/**
 * Runs a GSAP setup function inside a scoped context and reverts every
 * animation and ScrollTrigger it created on unmount — the standard guard
 * against leaking triggers across route changes.
 *
 * Two safety rules, because these animations hide content before revealing it:
 *
 *  - Skipped entirely under `prefers-reduced-motion`, so every component using
 *    this must already render correctly in its final state.
 *  - Never built while the tab is hidden. Background tabs throttle
 *    requestAnimationFrame to a stop, so a `from({ autoAlpha: 0 })` would paint
 *    its hidden start state and then never tick out of it — leaving a blank
 *    section for anyone who opens the page in a background tab. Setup is
 *    deferred until the document is actually visible.
 */
export function useGsap(
  setup: (ctx: { scope: HTMLElement | null }) => void,
  deps: React.DependencyList = [],
) {
  const scopeRef = React.useRef<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    const build = () => {
      if (cancelled || ctx) return;
      ctx = gsap.context(() => setup({ scope: scopeRef.current }), scopeRef);
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      build();
    };

    if (document.visibilityState === "visible") build();
    else document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}
