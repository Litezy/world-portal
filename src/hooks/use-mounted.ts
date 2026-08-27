"use client";

import * as React from "react";

const noopSubscribe = () => () => {};

/**
 * False during SSR and the first client render, true afterwards. Gate anything
 * that reads browser-only state (theme, matchMedia, localStorage) to avoid
 * hydration mismatches.
 *
 * useSyncExternalStore rather than useState + useEffect: React handles the
 * server/client snapshot split without a cascading re-render.
 */
export function useMounted() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
