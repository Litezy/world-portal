"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Every kind of thing a trip can be assembled from. Only `pro` can be added
 * today; the rest exist so flights, stays and the visa fee drop straight in
 * when those flows open, without reshaping the basket.
 */
export type BasketItemType =
  "pro" | "flight" | "stay" | "car" | "attraction" | "visa" | "passport";

export type BasketItem = {
  /** Stable and unique per line, e.g. "pro:kenji-watanabe". Re-adding replaces. */
  id: string;
  type: BasketItemType;
  title: string;
  subtitle?: string;
  city?: string;
  /** `null` means "priced after review" — a visa fee we cannot quote up front. */
  price: number | null;
  unit?: string;
  href?: string;
};

type BasketState = {
  items: BasketItem[];
  add: (item: BasketItem) => void;
  remove: (id: string) => void;
  toggle: (item: BasketItem) => void;
  clear: () => void;
};

/**
 * localStorage is not always there to be written to: it is absent during SSR,
 * absent in the test environment, and in Safari's private mode merely touching
 * it throws. The basket must keep working in memory in all three cases rather
 * than taking the page down, so persistence degrades to a no-op.
 */
const memoryStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

function safeStorage(): Storage {
  if (typeof window === "undefined") return memoryStorage;
  try {
    const probe = "__e-embassy.probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryStorage;
  }
}

export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => ({
          // Replace rather than duplicate: the same professional booked twice
          // is one line, not two.
          items: [...s.items.filter((i) => i.id !== item.id), item],
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      toggle: (item) =>
        set((s) =>
          s.items.some((i) => i.id === item.id)
            ? { items: s.items.filter((i) => i.id !== item.id) }
            : { items: [...s.items, item] },
        ),
      clear: () => set({ items: [] }),
    }),
    {
      name: "e-embassy.basket",
      version: 1,
      storage: createJSONStorage(safeStorage),
      // Only the contents are worth keeping; the actions are rebuilt on load.
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

/** Sum of everything we can actually price. Items awaiting a quote are excluded. */
export function basketTotal(items: BasketItem[]) {
  return items.reduce((sum, i) => sum + (i.price ?? 0), 0);
}

/** True when at least one line has no price yet, so the total is a subtotal. */
export function hasUnpricedItems(items: BasketItem[]) {
  return items.some((i) => i.price === null);
}

export const basketTypeLabels: Record<BasketItemType, string> = {
  pro: "Hired pro",
  flight: "Flight",
  stay: "Stay",
  car: "Car",
  attraction: "Attraction",
  visa: "Visa",
  passport: "Passport",
};
