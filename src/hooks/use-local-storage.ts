"use client";

import * as React from "react";

/**
 * Persisted state that survives reloads and stays in sync across tabs and
 * across every hook instance reading the same key.
 *
 * getSnapshot must be referentially stable or React re-renders forever, so
 * parsed values are memoised against the raw string they came from.
 */
type CacheEntry = { raw: string | null; value: unknown };

const cache = new Map<string, CacheEntry>();
const listeners = new Map<string, Set<() => void>>();

function readRaw(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private mode or blocked storage.
    return null;
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, onChange: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(onChange);

  // Writes from other tabs.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set.delete(onChange);
    if (set.size === 0) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Pinned once so an inline default (`{}`, `[]`) does not churn the snapshot.
  const fallbackRef = React.useRef(initialValue);

  const getSnapshot = React.useCallback((): T => {
    const raw = readRaw(key);
    const cached = cache.get(key);
    if (cached && cached.raw === raw) return cached.value as T;

    let value = fallbackRef.current;
    if (raw !== null) {
      try {
        value = JSON.parse(raw) as T;
      } catch {
        // Malformed payload written by other code — fall back.
      }
    }
    cache.set(key, { raw, value });
    return value;
  }, [key]);

  const value = React.useSyncExternalStore(
    React.useCallback((onChange: () => void) => subscribe(key, onChange), [key]),
    getSnapshot,
    () => fallbackRef.current,
  );

  const setValue = React.useCallback(
    (next: T | ((previous: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (previous: T) => T)(getSnapshot()) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota or permission error — still notify so the UI stays responsive.
      }
      emit(key);
    },
    [key, getSnapshot],
  );

  const remove = React.useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
    emit(key);
  }, [key]);

  return [value, setValue, remove] as const;
}
