"use client";

import Link from "next/link";

import { motion } from "motion/react";

import { chartCopy as copy } from "@/content/admin";
import { ChartTable } from "@/features/dashboard/components/chart-table";
import { cn } from "@/lib/utils";

/**
 * `key` should be the status enum, so colour follows the data rather than its
 * display label. It falls back to the label for callers that have none (the
 * applicant dashboard): "Under review" and `UNDER_REVIEW` resolve alike.
 */
export type BarListItem = { key?: string; label: string; value: number; href?: string };

const keyOf = (item: BarListItem) =>
  (item.key ?? item.label).toUpperCase().replace(/[\s-]+/g, "_");

/** Same bar gradients as before, from tokens (`--chart-stage-*`). */
const barFor = (key: string) => {
  const slug = key.toLowerCase().replace(/_/g, "-");
  const from = `var(--chart-stage-${slug}, var(--chart-visa))`;
  const to = `var(--chart-stage-${slug}-to, var(--chart-passport))`;
  return {
    backgroundImage: `linear-gradient(to right, ${from}, ${to})`,
    glow: `0 0 10px color-mix(in oklab, ${from} 30%, transparent)`,
  };
};

/** Share chips use the status text/wash tokens so they read in both themes. */
const chipTone: Record<string, string> = {
  SUBMITTED: "bg-info-wash text-info-text",
  EVALUATED: "bg-warning-wash text-warning-text",
  UNDER_REVIEW: "bg-primary/10 text-primary",
  APPROVED: "bg-success-wash text-success-text",
  REJECTED: "bg-destructive-wash text-destructive-text",
};

/**
 * Pipeline bars. Each stage's count and share are printed; a stage with an
 * `href` links straight to that filtered list (count → queue).
 */
export function BarList({
  items,
  className,
}: {
  items: BarListItem[];
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((sum, i) => sum + i.value, 0);

  if (total === 0) {
    return (
      <p className={cn("text-[13px] text-muted-foreground", className)}>
        {copy.pipelineEmpty}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <ul className="flex flex-col gap-4.5">
        {items.map((item, index) => {
          const percentage = Math.round((item.value / total) * 100) || 0;
          const key = keyOf(item);
          const bar = barFor(key);
          const label = item.href ? (
            <Link
              href={item.href}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          );

          return (
            <li key={key} className="group flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {label}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums",
                      chipTone[key] ?? "bg-primary/10 text-primary",
                    )}
                  >
                    {percentage}%
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {item.value}
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/40 p-[1px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / max) * 100}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative h-full rounded-full transition-shadow duration-300 group-hover:shadow-md"
                  style={{
                    backgroundImage: bar.backgroundImage,
                    boxShadow: item.value > 0 ? bar.glow : "none",
                  }}
                >
                  <div className="absolute top-0 right-0 h-full w-2 rounded-r-full bg-white/40 blur-[1px]" />
                </motion.div>
              </div>
            </li>
          );
        })}
      </ul>

      <ChartTable
        caption={copy.pipelineCaption}
        columns={[copy.stage, copy.count, copy.share]}
        rows={items.map((i) => [
          i.label,
          i.value,
          `${Math.round((i.value / total) * 100) || 0}%`,
        ])}
      />
    </div>
  );
}
