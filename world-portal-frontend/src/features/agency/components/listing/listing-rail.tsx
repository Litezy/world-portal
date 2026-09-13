"use client";

import * as React from "react";

import { Check, FileWarning } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { agencyListing } from "@/content/agency";
import { listingFlowCopy } from "@/features/agency/components/listing/copy";
import type { StepCompletion, StepId } from "@/features/agency/components/listing/form";
import {
  SaveIndicator,
  type SaveState,
} from "@/features/agency/components/listing/save-indicator";
import { cn } from "@/lib/utils";

/**
 * The persistent step rail.
 *
 * It answers two questions at all times: where am I, and what is left. The
 * outstanding-documents count sits here rather than only on step 3, because
 * that is the number that decides whether the listing can go in at all.
 */
export function ListingRail({
  current,
  completion,
  isReachable,
  onSelect,
  outstanding,
  saveState,
}: {
  current: number;
  completion: StepCompletion;
  isReachable: (index: number) => boolean;
  onSelect: (index: number) => void;
  outstanding: number;
  saveState: SaveState;
}) {
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
  const steps = agencyListing.steps;

  const done = steps.filter((step) => completion[step.id as StepId]).length;
  const percent = Math.round((done / steps.length) * 100);

  /** Arrow keys walk the rail; Home and End jump. Tab still leaves it. */
  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const last = steps.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index + 1;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    buttons.current[Math.min(Math.max(next, 0), last)]?.focus();
  }

  return (
    <nav aria-label={listingFlowCopy.progressLabel} className="lg:sticky lg:top-24">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Progress
            value={percent}
            className="h-1.5"
            aria-label={listingFlowCopy.progressLabel}
          />
          <SaveIndicator state={saveState} />
        </div>

        <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {steps.map((step, index) => {
            const id = step.id as StepId;
            const complete = completion[id];
            const active = index === current;
            const reachable = isReachable(index);

            return (
              <li key={step.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  ref={(node) => {
                    buttons.current[index] = node;
                  }}
                  onClick={() => reachable && onSelect(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  disabled={!reachable}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none",
                    active && "bg-primary/18",
                    !active && reachable && "hover:bg-secondary",
                    !reachable && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                      active && "bg-primary text-primary-foreground",
                      !active && complete && "bg-success text-success-foreground",
                      !active && !complete && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {complete && !active ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-[13px] font-medium whitespace-nowrap",
                        active ? "text-ink-900" : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="hidden text-[11.5px] leading-snug text-muted-foreground lg:block">
                      {step.body}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div
          className={cn(
            "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12px] leading-snug",
            outstanding > 0
              ? "border-warning/35 bg-warning/12 text-warning-foreground"
              : "border-success/25 bg-success/8 text-success",
          )}
        >
          {outstanding > 0 ? (
            <FileWarning className="mt-px size-3.5 shrink-0" />
          ) : (
            <Check className="mt-px size-3.5 shrink-0" />
          )}
          <span>
            {outstanding === 0
              ? listingFlowCopy.outstandingNone
              : outstanding === 1
                ? listingFlowCopy.outstandingOne
                : listingFlowCopy.outstandingMany(outstanding)}
          </span>
        </div>
      </div>
    </nav>
  );
}
