"use client";

import * as React from "react";
import Link from "next/link";

import {
  Briefcase,
  Car,
  Hotel,
  Plane,
  ShoppingBag,
  Sparkles,
  Stamp,
  Ticket,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type BasketItemType,
  basketTotal,
  basketTypeLabels,
  hasUnpricedItems,
  useBasketStore,
} from "@/features/basket/store";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency } from "@/lib/utils";

const TYPE_ICON: Record<BasketItemType, typeof Plane> = {
  pro: Briefcase,
  flight: Plane,
  stay: Hotel,
  car: Car,
  attraction: Ticket,
  visa: Stamp,
  passport: Stamp,
};

export function BasketDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const items = useBasketStore((s) => s.items);
  const remove = useBasketStore((s) => s.remove);
  const clear = useBasketStore((s) => s.clear);
  const mounted = useMounted();

  // The store rehydrates from localStorage after mount, so rendering its
  // contents before then would mismatch the server's empty basket.
  const lines = mounted ? items : [];
  const total = basketTotal(lines);
  const pending = hasUnpricedItems(lines);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex flex-col sm:max-w-md">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle className="flex items-center gap-2.5">
            <ShoppingBag className="size-5 text-primary" />
            Your trip basket
          </DrawerTitle>
          <DrawerDescription>
            Build your journey piece by piece — the people you hire, and soon the
            flights and stays too.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {lines.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Nothing in the basket yet"
              description="Add a professional at your destination and it will show up here with a running total."
              action={
                <DrawerClose asChild>
                  <Button asChild variant="primary" size="sm">
                    <Link href="/hire">Browse professionals</Link>
                  </Button>
                </DrawerClose>
              }
            />
          ) : (
            <ul className="grid gap-3">
              {lines.map((item) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border bg-secondary/40 p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary">
                        <Icon className="size-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="muted" size="sm">
                            {basketTypeLabels[item.type]}
                          </Badge>
                          {item.city ? (
                            <span className="text-[12px] text-muted-foreground">
                              {item.city}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[14px] font-semibold text-ink-900">
                          {item.title}
                        </p>
                        {item.subtitle ? (
                          <p className="text-[12.5px] text-muted-foreground">
                            {item.subtitle}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-[15px] font-semibold text-ink-900">
                          {item.price === null ? "—" : formatCurrency(item.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          aria-label={`Remove ${item.title}`}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="border-t border-border p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-medium text-ink-900">
                Estimated total
              </span>
              <span className="text-[24px] font-semibold text-ink-900">
                {formatCurrency(total)}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {pending
                ? "Some items are still to be quoted, so this will change."
                : "Indicative — a consultant confirms the final figure before you pay."}
            </p>

            <Button asChild variant="primary" size="block" className="mt-4">
              <Link href="/start">
                <Sparkles className="size-4" />
                Turn this into a trip
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="mt-2"
              onClick={clear}
            >
              Clear basket
            </Button>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
