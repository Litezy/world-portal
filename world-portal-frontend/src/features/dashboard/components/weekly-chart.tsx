"use client";

import * as React from "react";
import { motion } from "motion/react";

import { cn, formatCurrency } from "@/lib/utils";

export type WeeklyPoint = { label: string; visas: number; passports: number };

export function WeeklyChart({
  data,
  className,
}: {
  data: WeeklyPoint[];
  className?: string;
}) {
  const [activePointIndex, setActivePointIndex] = React.useState<number | null>(null);

  const maxVal = Math.max(1, ...data.flatMap((d) => [d.visas, d.passports]));
  const width = 600;
  const height = 240;
  const paddingX = 30;
  const paddingY = 24;


  const pointsCount = data.length;
  const stepX = (width - paddingX * 2) / Math.max(1, pointsCount - 1);

  // Generate smooth SVG Bézier path string for series
  const generatePath = (key: "visas" | "passports") => {
    if (pointsCount === 0) return "";
    const coords = data.map((d, i) => {
      const x = paddingX + i * stepX;
      const y = height - paddingY - (d[key] / maxVal) * (height - paddingY * 2);
      return { x, y };
    });

    if (coords.length === 1) return `M ${coords[0]!.x} ${coords[0]!.y}`;

    let path = `M ${coords[0]!.x} ${coords[0]!.y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i]!;
      const next = coords[i + 1]!;
      const cpX = (curr.x + next.x) / 2;
      path += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }
    return { path, coords };
  };

  const visaData = generatePath("visas");
  const passportData = generatePath("passports");

  const visaAreaPath = typeof visaData !== "string" && visaData.coords ? 
    `${visaData.path} L ${visaData.coords[visaData.coords.length - 1]!.x} ${height - paddingY} L ${visaData.coords[0]!.x} ${height - paddingY} Z` : "";

  const activePoint = activePointIndex !== null ? data[activePointIndex] : null;

  return (
    <div className={cn("relative flex flex-col gap-4", className)}>
      {/* Legend & Tooltip Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand-600 shadow-sm" />
            <span className="font-medium text-foreground">Visas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-cyan-400 shadow-sm" />
            <span className="font-medium text-foreground">Passports</span>
          </div>
        </div>

        {activePoint && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/60 px-2.5 py-1 text-xs"
          >
            <span className="font-semibold text-foreground">{activePoint.label}:</span>
            <span className="text-brand-600 font-semibold">{activePoint.visas} Visas</span>
            <span className="text-cyan-600 font-semibold">{activePoint.passports} Passports</span>
          </motion.div>
        )}
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-muted/20 p-2">

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
        >
          <defs>
            <linearGradient id="visaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0050C0" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0050C0" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="passportGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00B8F8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00B8F8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-border/60"
              />
            );
          })}

          {/* Visa Area Fill */}
          {visaAreaPath && (
            <motion.path
              d={visaAreaPath}
              fill="url(#visaGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />
          )}

          {/* Visa Curve Line */}
          {typeof visaData !== "string" && (
            <motion.path
              d={visaData.path}
              fill="none"
              stroke="#0050C0"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Passport Curve Line */}
          {typeof passportData !== "string" && (
            <motion.path
              d={passportData.path}
              fill="none"
              stroke="#00B8F8"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Interactive Hover Indicators */}
          {data.map((d, i) => {
            const x = paddingX + i * stepX;
            const isHovered = activePointIndex === i;

            return (
              <g key={d.label} className="cursor-pointer">
                {/* Transparent hover column catch area */}
                <rect
                  x={x - stepX / 2}
                  y={0}
                  width={stepX}
                  height={height}
                  fill="transparent"
                  onMouseEnter={() => setActivePointIndex(i)}
                  onMouseLeave={() => setActivePointIndex(null)}
                />

                {/* Vertical hover guide line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#0050C0"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                )}

                {/* Visa Point Circle */}
                {typeof visaData !== "string" && visaData.coords[i] && (
                  <circle
                    cx={x}
                    cy={visaData.coords[i]!.y}
                    r={isHovered ? 6 : 4}
                    fill="#0050C0"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between px-4 text-[11.5px] font-medium text-muted-foreground">
        {data.map((point, i) => (
          <button
            key={point.label}
            type="button"
            onMouseEnter={() => setActivePointIndex(i)}
            onMouseLeave={() => setActivePointIndex(null)}
            className={cn(
              "transition-colors hover:text-foreground",
              activePointIndex === i && "font-semibold text-primary",
            )}
          >
            {point.label}
          </button>
        ))}
      </div>
    </div>
  );
}
