"use client";

import * as React from "react";

/**
 * Defers mounting a decorative, expensive child (the WebGL layers) until the
 * browser is idle.
 *
 * Two details matter:
 *  - `requestIdleCallback` never fires while a tab is hidden, so a page opened
 *    in a background tab would otherwise never mount the layer at all. The
 *    visibility listener covers that.
 *  - Anything gated on this must be pure decoration, because it may never
 *    arrive — no WebGL, reduced motion, or a tab closed before it fires.
 */
export function useIdleMount(timeout = 2500) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (ready) return;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (document.visibilityState !== "visible") return;
      if (window.requestIdleCallback) {
        idleId = window.requestIdleCallback(() => setReady(true), { timeout });
      } else {
        timerId = setTimeout(() => setReady(true), Math.min(timeout, 1200));
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (idleId !== undefined && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) clearTimeout(timerId);
    };
  }, [ready, timeout]);

  return ready;
}
