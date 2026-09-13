import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  type LucideIcon,
  Sparkles,
  Sun,
} from "lucide-react";

import { type ForecastIcon, hero } from "@/content/landing";
import { cn } from "@/lib/utils";

/**
 * `ForecastIcon` is a content-level name, not a component name, so the copy in
 * `src/content/landing.ts` never has to know which icon set we ship. Adding a
 * condition means adding a key here and the union stops the build until you do.
 */
const forecastIcons: Record<ForecastIcon, LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
};

/**
 * Destination weather, bottom-right of the hero.
 *
 * Deliberately dumb: no state, no hooks, no `"use client"`. The hero owns the
 * reveal and targets `[data-hero-forecast]`, so this stays a Server Component
 * and adds nothing to the first bundle — which already carries the hero's
 * Three.js photograph shader competing for the main thread.
 *
 * It sits on a dark photograph, so it composes `.glass-frost-dark` (ink-tinted
 * frost, light type) with `.glass-3d` (lift + specular sweep) rather than
 * writing another `backdrop-filter` rule. Every number is `tabular-nums` so a
 * 9° and a 31° occupy the same column and the five-day strip does not jitter.
 */
export function HeroForecastCard({ className }: { className?: string }) {
  const { forecast } = hero;
  const { unit } = forecast;

  // The strip's first entry is today, so it also names the current condition.
  const CurrentIcon = forecastIcons[forecast.days[0]?.icon ?? "sun"];

  return (
    <div
      data-hero-forecast
      role="group"
      aria-label={`${forecast.eyebrow} ${forecast.place}, ${forecast.region}`}
      className={cn(
        "glass-frost-dark glass-3d w-full rounded-[1.75rem] p-5 text-white sm:p-6 lg:max-w-95",
        className,
      )}
    >
      {/* 1 — where, and when there */}
      <div className={cn("flex items-start justify-between gap-3")}>
        <div className={cn("min-w-0")}>
          <p
            className={cn(
              "text-[0.65rem] font-medium tracking-[0.18em] text-white/55 uppercase",
            )}
          >
            {forecast.eyebrow}
          </p>
          <p
            className={cn(
              "mt-1.5 truncate text-lg font-semibold tracking-tight text-white",
            )}
          >
            {forecast.place}
          </p>
          <p className={cn("truncate text-sm text-white/60")}>{forecast.region}</p>
        </div>

        <p
          className={cn(
            "shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1",
            "text-[0.7rem] font-medium text-white/75 tabular-nums",
          )}
        >
          {forecast.local}
        </p>
      </div>

      {/* 2 — the headline number */}
      <div className={cn("mt-4 flex items-end justify-between gap-4 sm:mt-6")}>
        <div className={cn("min-w-0")}>
          <p className={cn("flex items-start gap-1")}>
            <span
              className={cn(
                "text-[3rem] leading-[0.82] font-semibold tracking-tighter tabular-nums sm:text-[3.75rem]",
              )}
            >
              {forecast.temperature}
            </span>
            <span className={cn("mt-1 text-xl font-medium text-white/70")}>{unit}</span>
          </p>
          <p className={cn("mt-2 truncate text-sm font-medium text-white/75 sm:mt-3")}>
            {forecast.condition}
          </p>
        </div>

        <CurrentIcon
          aria-hidden="true"
          strokeWidth={1.25}
          className={cn("size-11 shrink-0 text-white/85 sm:size-16")}
        />
      </div>

      {/* 3 — humidity / wind / UV, split by hairlines */}
      <dl
        className={cn(
          "mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl sm:mt-6",
          "border border-white/10 bg-white/6 py-2.5 sm:py-3",
        )}
      >
        {forecast.metrics.map((metric) => (
          <div key={metric.label} className={cn("px-2 text-center")}>
            <dt
              className={cn(
                "truncate text-[0.6rem] font-medium tracking-[0.14em] text-white/50 uppercase",
              )}
            >
              {metric.label}
            </dt>
            <dd
              className={cn(
                "mt-1 truncate text-sm font-semibold text-white/90 tabular-nums",
              )}
            >
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* 4 — five days. Fixed 5-column grid so it can never wrap. */}
      <ul
        className={cn(
          "mt-4 grid grid-cols-5 gap-x-1 border-t border-white/10 pt-4 sm:mt-5 sm:pt-5",
        )}
      >
        {forecast.days.map((day) => {
          const DayIcon = forecastIcons[day.icon];
          return (
            <li key={day.day} className={cn("flex flex-col items-center gap-2")}>
              <span
                className={cn(
                  "text-[0.62rem] font-medium tracking-widest text-white/55 uppercase",
                )}
              >
                {day.day}
              </span>
              <DayIcon
                aria-hidden="true"
                strokeWidth={1.5}
                className={cn("size-5 text-white/80")}
              />
              {/* Screen readers get the units; sighted readers get the glyph. */}
              <span className={cn("sr-only")}>
                {`High ${day.high}${unit}, low ${day.low}${unit}`}
              </span>
              <span
                aria-hidden="true"
                className={cn("flex items-baseline gap-1 text-[0.8rem] tabular-nums")}
              >
                <span className={cn("font-semibold text-white")}>{day.high}&deg;</span>
                <span className={cn("text-white/45")}>{day.low}&deg;</span>
              </span>
            </li>
          );
        })}
      </ul>

      {/* 5 — the one brand accent on the card */}
      <p
        className={cn(
          "mt-4 flex items-start gap-2 border-t border-white/10 pt-3.5 sm:mt-5 sm:pt-4",
          "text-[0.72rem] leading-snug font-medium text-white/65",
        )}
      >
        {/* The note wraps to two or three lines, so the glyph pins to the
            first one rather than floating in the middle of the block. */}
        <Sparkles
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn("mt-px size-3.5 shrink-0 text-brand-300")}
        />
        <span className={cn("min-w-0")}>{forecast.note}</span>
      </p>
    </div>
  );
}
