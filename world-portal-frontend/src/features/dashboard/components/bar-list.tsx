"use client";

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type BarListItem = { label: string; value: number; hint?: string };

const STAGE_COLORS: Record<string, { fill: string; glow: string; badge: string }> = {
  Submitted: {
    fill: "from-blue-600 to-cyan-500",
    glow: "rgba(0,184,248,0.3)",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  Evaluated: {
    fill: "from-amber-500 to-yellow-400",
    glow: "rgba(245,158,11,0.3)",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  "Under review": {
    fill: "from-purple-600 to-indigo-500",
    glow: "rgba(147,51,234,0.3)",
    badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  Approved: {
    fill: "from-emerald-500 to-teal-400",
    glow: "rgba(16,185,129,0.3)",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  Rejected: {
    fill: "from-rose-600 to-pink-500",
    glow: "rgba(244,63,94,0.3)",
    badge: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
};

export function BarList({
  items,
  emptyLabel = "Nothing here yet",
  className,
}: {
  items: BarListItem[];
  emptyLabel?: string;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((sum, i) => sum + i.value, 0);

  if (total === 0) {
    return (
      <p className={cn("text-[13px] text-muted-foreground", className)}>{emptyLabel}</p>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-4.5", className)}>
      {items.map((item, index) => {
        const percentage = Math.round((item.value / total) * 100) || 0;
        const widthPercent = (item.value / max) * 100;
        const colorConfig = STAGE_COLORS[item.label] || {
          fill: "from-primary to-cyan-500",
          glow: "rgba(0,80,192,0.3)",
          badge: "bg-primary/10 text-primary border-primary/20",
        };

        return (
          <li key={item.label} className="group flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{item.label}</span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tabular-nums",
                    colorConfig.badge,
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
                animate={{ width: `${widthPercent}%` }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "relative h-full rounded-full bg-gradient-to-r transition-shadow duration-300 group-hover:shadow-md",
                  colorConfig.fill,
                )}
                style={{
                  boxShadow: item.value > 0 ? `0 0 10px ${colorConfig.glow}` : "none",
                }}
              >
                <div className="absolute top-0 right-0 h-full w-2 rounded-r-full bg-white/40 blur-[1px]" />
              </motion.div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
