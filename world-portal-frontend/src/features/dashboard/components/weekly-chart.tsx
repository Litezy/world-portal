"use client";

import * as React from "react";

import { motion } from "motion/react";

import { chartCopy as copy } from "@/content/admin";
import { ChartTable } from "@/features/dashboard/components/chart-table";
import { cn } from "@/lib/utils";

export type WeeklyPoint = { label: string; visas: number; passports: number };

const WIDTH = 600;
const HEIGHT = 240;
const PAD_X = 30;
const PAD_Y = 24;

const VISA = "var(--chart-visa)";
const PASSPORT = "var(--chart-passport)";

type Point = { x: number; y: number };

function coordsFor(
  data: WeeklyPoint[],
  key: "visas" | "passports",
  max: number,
): Point[] {
  const step = (WIDTH - PAD_X * 2) / Math.max(1, data.length - 1);
  return data.map((d, i) => ({
    x: PAD_X + i * step,
    y: HEIGHT - PAD_Y - (d[key] / max) * (HEIGHT - PAD_Y * 2),
  }));
}

/** Smooth Bézier through the points (unchanged from the original chart). */
function pathFor(coords: Point[]) {
  if (coords.length === 0) return "";
  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const cpX = (coords[i].x + coords[i + 1].x) / 2;
    path += ` C ${cpX} ${coords[i].y}, ${cpX} ${coords[i + 1].y}, ${coords[i + 1].x} ${coords[i + 1].y}`;
  }
  return path;
}

/**
 * Visas and passports per day for the last week. Same look as before; now
 * every value is printed under its day (the readout no longer needs a
 * hover), days are keyboard-focusable, an empty week says so, and the
 * numbers are also available as a table.
 */
export function WeeklyChart({
  data,
  className,
}: {
  data: WeeklyPoint[];
  className?: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);

  const max = Math.max(1, ...data.flatMap((d) => [d.visas, d.passports]));
  const visa = coordsFor(data, "visas", max);
  const passport = coordsFor(data, "passports", max);
  const visaPath = pathFor(visa);
  const passportPath = pathFor(passport);
  const visaArea =
    visa.length > 1
      ? `${visaPath} L ${visa[visa.length - 1].x} ${HEIGHT - PAD_Y} L ${visa[0].x} ${HEIGHT - PAD_Y} Z`
      : "";
  const step = (WIDTH - PAD_X * 2) / Math.max(1, data.length - 1);
  const isEmpty = data.every((d) => d.visas === 0 && d.passports === 0);
  const activePoint = active !== null ? data[active] : null;

  return (
    <div className={cn("relative flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full shadow-sm"
              style={{ background: VISA }}
            />
            <span className="font-medium text-foreground">{copy.visas}</span>
          </span>
          <span className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full shadow-sm"
              style={{ background: PASSPORT }}
            />
            <span className="font-medium text-foreground">{copy.passports}</span>
          </span>
        </div>

        {/* Live readout for the hovered or focused day. */}
        <p aria-live="polite" className="min-h-6 text-xs">
          {activePoint ? (
            <span className="inline-flex items-center gap-3 rounded-lg border border-border/60 bg-muted/60 px-2.5 py-1">
              <span className="font-semibold text-foreground">
                {activePoint.label}:
              </span>
              <span className="font-semibold text-foreground">
                {activePoint.visas} {copy.visas}
              </span>
              <span className="font-semibold text-foreground">
                {activePoint.passports} {copy.passports}
              </span>
            </span>
          ) : null}
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-muted/20 p-2">
        {isEmpty ? (
          <p className="grid h-[180px] place-items-center text-[13px] text-muted-foreground">
            {copy.weeklyEmpty}
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full overflow-visible"
            role="img"
            aria-label={copy.weeklyCaption}
          >
            <defs>
              <linearGradient id="visaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: VISA, stopOpacity: 0.35 }} />
                <stop offset="100%" style={{ stopColor: VISA, stopOpacity: 0 }} />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((ratio) => {
              const y = HEIGHT - PAD_Y - ratio * (HEIGHT - PAD_Y * 2);
              return (
                <line
                  key={ratio}
                  x1={PAD_X}
                  y1={y}
                  x2={WIDTH - PAD_X}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-border/60"
                />
              );
            })}

            {visaArea ? (
              <motion.path
                d={visaArea}
                fill="url(#visaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            ) : null}

            <motion.path
              d={visaPath}
              fill="none"
              style={{ stroke: VISA }}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.path
              d={passportPath}
              fill="none"
              style={{ stroke: PASSPORT }}
              strokeWidth="2.5"
              strokeDasharray="6 3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />

            {data.map((d, i) => {
              const x = visa[i].x;
              const hovered = active === i;
              return (
                <g key={d.label}>
                  <rect
                    x={x - step / 2}
                    y={0}
                    width={step}
                    height={HEIGHT}
                    fill="transparent"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                  />
                  {hovered ? (
                    <line
                      x1={x}
                      y1={PAD_Y}
                      x2={x}
                      y2={HEIGHT - PAD_Y}
                      style={{ stroke: VISA }}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="opacity-70"
                    />
                  ) : null}
                  <circle
                    cx={x}
                    cy={visa[i].y}
                    r={hovered ? 6 : 4}
                    style={{ fill: VISA }}
                    className="stroke-background transition-all duration-200"
                    strokeWidth="2"
                  />
                  {/* Passports get markers too, so both series read at a glance. */}
                  <circle
                    cx={x}
                    cy={passport[i].y}
                    r={hovered ? 5 : 3}
                    style={{ fill: PASSPORT }}
                    className="stroke-background transition-all duration-200"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Days with both values always visible — no value hides behind a hover. */}
      <div
        className="grid text-center"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, data.length)}, minmax(0, 1fr))`,
        }}
      >
        {data.map((point, i) => (
          <button
            key={point.label}
            type="button"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active === i && "text-foreground",
            )}
          >
            <span className={cn(active === i && "font-semibold text-primary")}>
              {point.label}
            </span>
            <span className="flex items-center gap-1 text-[10.5px] tabular-nums">
              <span
                className="size-1.5 rounded-full"
                style={{ background: VISA }}
                aria-hidden
              />
              {point.visas}
              <span
                className="ml-1 size-1.5 rounded-full"
                style={{ background: PASSPORT }}
                aria-hidden
              />
              {point.passports}
            </span>
          </button>
        ))}
      </div>

      <ChartTable
        caption={copy.weeklyCaption}
        columns={[copy.day, copy.visas, copy.passports]}
        rows={data.map((d) => [d.label, d.visas, d.passports])}
      />
    </div>
  );
}
