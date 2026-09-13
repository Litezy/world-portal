"use client";

import { Check, CloudOff, Loader2 } from "lucide-react";

import { listingFlowCopy } from "@/features/agency/components/listing/copy";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * The quiet half of autosave.
 *
 * Never a blocking spinner: the agency keeps typing through a save, and the
 * only thing they need is the reassurance that closing the tab is safe. It is
 * a live region so a screen reader hears "Saved" without the focus moving.
 */
export function SaveIndicator({
  state,
  className,
}: {
  state: SaveState;
  className?: string;
}) {
  const label =
    state === "saving"
      ? listingFlowCopy.saving
      : state === "saved"
        ? listingFlowCopy.saved
        : state === "error"
          ? listingFlowCopy.saveFailed
          : null;

  return (
    <p
      aria-live="polite"
      className={cn(
        "flex min-h-5 items-center gap-1.5 text-[12px] transition-opacity",
        state === "error" ? "text-destructive" : "text-muted-foreground",
        state === "idle" && "opacity-0",
        className,
      )}
    >
      {state === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {state === "saved" ? <Check className="size-3.5 text-success" /> : null}
      {state === "error" ? <CloudOff className="size-3.5" /> : null}
      {label}
    </p>
  );
}
