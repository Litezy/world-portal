"use client";

import * as React from "react";

import { motion } from "motion/react";

import { chartCopy as copy } from "@/content/admin";
import { ChartTable } from "@/features/dashboard/components/chart-table";
import { cn } from "@/lib/utils";

/**
 * `key` should be the category enum, so colour follows the data rather than
 * its display label. It falls back to the label for callers that have none
 * (the applicant dashboard).
 */
export type ShareSegment = { key?: string; label: string; value: number };

const keyOf = (s: ShareSegment) => s.key ?? s.label;

/** The palette the chart always used, now from tokens (`--chart-cat-*`). */
const tokenFor = (key: string) => {
  const slug = key.toLowerCase().replace(/[\s_]+/g, "-");
  return {
    from: `var(--chart-cat-${slug}, var(--chart-visa))`,
    to: `var(--chart-cat-${slug}-to, var(--chart-passport))`,
  };
};

const RADIUS = 58;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ShareBar({
  segments,
  className,
}: {
  segments: ShareSegment[];
  className?: string;
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const active = segments.filter((s) => s.value > 0);
  const percentOf = (value: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100);

  // Each arc starts where the previous ones end — computed up front, not by
  // mutating a counter during render.
  const arcs = active.map((segment, i) => {
    const percent = total === 0 ? 0 : segment.value / total;
    const before = active.slice(0, i).reduce((sum, s) => sum + s.value / total, 0);
    return {
      segment,
      dash: `${percent * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      offset: -before * CIRCUMFERENCE,
    };
  });

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="relative flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/20 px-4 py-4">
        {total === 0 ? (
          <p className="grid h-36 place-items-center text-[13px] text-muted-foreground">
            {copy.categoriesEmpty}
          </p>
        ) : (
          <div className="relative flex items-center justify-center">
            <div className="pointer-events-none absolute size-32 rounded-full bg-brand-600/10 blur-xl" />
            <svg
              width="144"
              height="144"
              viewBox="0 0 144 144"
              className="-rotate-90 transform"
              role="img"
              aria-label={copy.categoriesCaption}
            >
              <circle
                cx="72"
                cy="72"
                r={RADIUS}
                stroke="currentColor"
                strokeWidth={STROKE}
                fill="transparent"
                className="text-muted/30"
              />
              {arcs.map(({ segment, dash, offset }, i) => {
                return (
                  <motion.circle
                    key={keyOf(segment)}
                    cx="72"
                    cy="72"
                    r={RADIUS}
                    style={{ stroke: tokenFor(keyOf(segment)).from }}
                    strokeWidth={hovered === i ? STROKE + 4 : STROKE}
                    strokeDasharray={dash}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
                    animate={{
                      strokeDasharray: dash,
                      strokeDashoffset: offset,
                      transition: {
                        duration: 0.8,
                        delay: i * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer transition-all duration-300"
                  />
                );
              })}
            </svg>

            <div
              aria-live="polite"
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <span className="font-sans text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {hovered !== null ? active[hovered]?.value : total}
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {hovered !== null ? active[hovered]?.label : copy.visas}
              </span>
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {segments.map((segment) => {
          const percent = percentOf(segment.value);
          const colour = tokenFor(keyOf(segment));
          return (
            <li
              key={keyOf(segment)}
              className="flex flex-col gap-1 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: colour.from }}
                  />
                  <span className="font-medium text-foreground">{segment.label}</span>
                </span>
                <span className="flex items-center gap-2 font-mono text-[11.5px] tabular-nums">
                  <span className="font-semibold text-foreground">{segment.value}</span>
                  <span className="text-[10.5px] text-muted-foreground">
                    ({percent}%)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${colour.from}, ${colour.to})`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <ChartTable
        caption={copy.categoriesCaption}
        columns={[copy.category, copy.count, copy.share]}
        rows={segments.map((s) => [s.label, s.value, `${percentOf(s.value)}%`])}
      />
    </div>
  );
}
