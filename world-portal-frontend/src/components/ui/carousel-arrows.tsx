"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type CarouselArrowsProps = {
  onPrev: () => void;
  onNext: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  className?: string;
  variant?: "solid" | "glass";
  label?: string;
};

/** The paired circular prev/next controls used by both carousels. */
export function CarouselArrows({
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  className,
  variant = "solid",
  label = "carousel",
}: CarouselArrowsProps) {
  const base = cn(
    "grid size-11 place-items-center rounded-full transition-[transform,box-shadow,opacity] duration-300",
    "focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-35",
    "not-disabled:hover:-translate-y-0.5 not-disabled:active:translate-y-px",
    variant === "glass"
      ? "glass text-ink-900"
      : "bg-white text-ink-900 shadow-[0_2px_6px_-2px_rgba(12,14,18,0.20),0_12px_24px_-14px_rgba(12,14,18,0.45)]",
  );

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={`Previous ${label} item`}
        className={base}
      >
        <ArrowLeft className="size-[18px]" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={`Next ${label} item`}
        className={base}
      >
        <ArrowRight className="size-[18px]" />
      </button>
    </div>
  );
}
