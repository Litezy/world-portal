"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { ShoppingBag } from "lucide-react";

import { useBasketStore } from "@/features/basket/store";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/**
 * The drawer and everything it pulls in (vaul, the line-item UI) is only
 * fetched once someone actually opens the basket. It sits in the header on
 * every page, and the landing page has a Three.js hero competing for the main
 * thread — keeping it out of the first bundle is what lets the rest of the
 * page hydrate promptly.
 */
const BasketDrawer = dynamic(
  () =>
    import("@/features/basket/components/basket-drawer").then((m) => m.BasketDrawer),
  { ssr: false },
);

/**
 * Header entry point for the basket. The count is only rendered after mount —
 * the store rehydrates from localStorage on the client, so painting a number
 * during SSR would flash the wrong value.
 */
export function BasketButton({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  // Mounting the drawer is what loads its chunk, so it stays out of the tree
  // until first use; after that it stays mounted so it can animate shut.
  const [everOpened, setEverOpened] = React.useState(false);
  const count = useBasketStore((s) => s.items.length);
  const mounted = useMounted();
  const shown = mounted ? count : 0;

  function openBasket() {
    setEverOpened(true);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openBasket}
        aria-label={
          shown > 0
            ? `Trip basket, ${shown} item${shown === 1 ? "" : "s"}`
            : "Trip basket"
        }
        className={cn(
          "relative grid size-10 place-items-center rounded-full text-white transition-colors",
          "hover:bg-white/12 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          className,
        )}
      >
        <ShoppingBag className="size-5" />
        {shown > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground ring-2 ring-ink-950">
            {shown}
          </span>
        ) : null}
      </button>

      {everOpened ? <BasketDrawer open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
