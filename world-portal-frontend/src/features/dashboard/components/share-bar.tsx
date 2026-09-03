"use client";

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type ShareSegment = { label: string; value: number };

const CATEGORY_COLORS: Record<string, { stroke: string; bg: string; text: string; gradient: string }> = {
  Tourist: {
    stroke: "#0050C0",
    bg: "bg-brand-600",
    text: "text-brand-600",
    gradient: "from-brand-600 to-cyan-500",
  },
  Business: {
    stroke: "#00B8F8",
    bg: "bg-cyan-500",
    text: "text-cyan-600",
    gradient: "from-cyan-500 to-blue-400",
  },
  Student: {
    stroke: "#8B5CF6",
    bg: "bg-purple-500",
    text: "text-purple-600",
    gradient: "from-purple-500 to-indigo-400",
  },
  Work: {
    stroke: "#10B981",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    gradient: "from-emerald-500 to-teal-400",
  },
  Transit: {
    stroke: "#F59E0B",
    bg: "bg-amber-500",
    text: "text-amber-600",
    gradient: "from-amber-500 to-yellow-400",
  },
};

const ALL_CATEGORIES = ["Tourist", "Business", "Student", "Work", "Transit"];

export function ShareBar({
  segments,
  className,
}: {
  segments: ShareSegment[];
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Normalize segments to include all categories so layout is rich
  const fullSegments = ALL_CATEGORIES.map((category) => {
    const found = segments.find((s) => s.label === category);
    return { label: category, value: found ? found.value : 0 };
  });

  const total = fullSegments.reduce((sum, s) => sum + s.value, 0);
  const activeSegments = fullSegments.filter((s) => s.value > 0);

  const radius = 58;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Top Interactive Centered Donut Block */}
      <div className="relative flex flex-col items-center justify-center rounded-xl bg-muted/20 py-4 px-4 border border-border/40">
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute size-32 rounded-full bg-brand-600/10 blur-xl pointer-events-none" />

          <svg
            width="144"
            height="144"
            viewBox="0 0 144 144"
            className="-rotate-90 transform"
          >
            {/* Base Ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-muted/30"
            />


            {/* Donut Arcs */}
            {activeSegments.map((segment, i) => {
              const percent = segment.value / total;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              const isHovered = hoveredIndex === i;
              const color = CATEGORY_COLORS[segment.label] || { stroke: "#0050C0", bg: "bg-primary" };

              return (
                <motion.circle
                  key={segment.label}
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke={color.stroke}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{
                    strokeDasharray,
                    strokeDashoffset,
                    transition: { duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Center Summary Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <motion.span
              key={hoveredIndex !== null ? activeSegments[hoveredIndex]?.label : "total"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-sans text-3xl font-bold tracking-tight text-foreground tabular-nums"

            >
              {hoveredIndex !== null ? activeSegments[hoveredIndex]?.value : total}
            </motion.span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {hoveredIndex !== null ? activeSegments[hoveredIndex]?.label : "Visas"}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Grid */}
      <div className="flex flex-col gap-2">
        {fullSegments.map((segment) => {
          const percent = total === 0 ? 0 : Math.round((segment.value / total) * 100);
          const colorConfig = CATEGORY_COLORS[segment.label] || {
            stroke: "#0050C0",
            bg: "bg-brand-600",
            text: "text-brand-600",
            gradient: "from-brand-600 to-cyan-500",
          };

          return (
            <div
              key={segment.label}
              className="group flex flex-col gap-1 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted/40"

            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", colorConfig.bg)} />
                  <span className="font-medium text-foreground">{segment.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11.5px] tabular-nums">
                  <span className="font-semibold text-foreground">{segment.value}</span>
                  <span className="text-muted-foreground text-[10.5px]">({percent}%)</span>
                </div>
              </div>

              {/* Progress Micro Meter */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-full rounded-full bg-gradient-to-r", colorConfig.gradient)}
                />
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
