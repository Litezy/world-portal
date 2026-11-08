import { type ForecastIcon, hero } from "@/content/landing";
import { glyphFor, Icon } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

type Glyph = ReturnType<typeof glyphFor>;

/** The plain cloud from the kit, lifted 2 units so rain or a bolt fits below it. */
const HIGH_CLOUD = "M17.5 17H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z";

/**
 * `ForecastIcon` is a content-level name, not a component name, so the copy in
 * `src/content/landing.ts` never has to know which icon set we ship. Adding a
 * condition means adding a key here and the union stops the build until you do.
 *
 * Sun and cloud are the design system's own duotone glyphs. The kit has no
 * mixed or wet weather, so those three are drawn here on the same model (a
 * soft back fill under a 2px front stroke, Lucide's strokes, ISC) and render
 * through the kit's `.cx-icon` classes, so all five read as one set.
 */
const forecastGlyphs: Record<ForecastIcon, Glyph> = {
  sun: glyphFor("sun"),
  "cloud-sun": {
    b: "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z",
    f: "M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z",
  },
  cloud: glyphFor("cloud"),
  rain: {
    b: HIGH_CLOUD,
    f: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M16 14v6M8 14v6M12 16v6",
  },
  storm: {
    b: HIGH_CLOUD,
    f: "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973M13 12l-3 5h4l-3 5",
  },
};

/** Weather glyphs are data, not brand, so they take the card's ink, not blue. */
function WeatherGlyph({ icon, className }: { icon: ForecastIcon; className?: string }) {
  const glyph = forecastGlyphs[icon];
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn("cx-icon cx-icon--current text-foreground/80", className)}
    >
      {glyph.b ? <path className={cn("b")} d={glyph.b} /> : null}
      {glyph.s ? <path className={cn("s")} d={glyph.s} /> : null}
      {glyph.f ? <path className={cn("f")} d={glyph.f} /> : null}
    </svg>
  );
}

/**
 * Destination weather, under the hero copy.
 *
 * Deliberately dumb: no state, no hooks, no `"use client"`. The hero owns the
 * reveal and targets `[data-hero-forecast]`, so this adds no behaviour of its
 * own to a bundle that already carries the hero's Three.js photograph shader.
 *
 * It sits on the photograph, so it is E-Embassy's water glass at the design
 * system's 20px card radius: `.glass` + `.glass-frost`, which follow the
 * theme (white frost and ink type in light, ink-tinted frost and light type in
 * dark), so every colour inside is a theme token, never a fixed white.
 * Inside, things are separated by fill rather than rules: the metrics share
 * one quiet surface, today gets a lifted cell, and the note sits in a footer
 * band. Every number is `tabular-nums` so a 9° and a 31°
 * occupy the same column and the five-day strip does not jitter.
 *
 * From `sm` up the card goes landscape (now on the left, the outlook on the
 * right), so it can share the hero's calm left half with the copy and leave
 * the photograph's subject uncovered.
 */
export function HeroForecastCard({ className }: { className?: string }) {
  const { forecast } = hero;
  const { unit } = forecast;

  // The strip's first entry is today, so it also names the current condition.
  const today = forecast.days[0]?.icon ?? "sun";

  return (
    <div
      data-hero-forecast
      role="group"
      aria-label={`${forecast.eyebrow} ${forecast.place}, ${forecast.region}`}
      className={cn(
        "glass glass-frost w-full overflow-hidden rounded-card text-foreground",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-5 p-5",
          "sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] sm:gap-7 sm:p-6",
        )}
      >
        {/* 1 — where, when there, and the headline number */}
        <div className={cn("flex min-w-0 flex-col")}>
          <p
            className={cn(
              "text-[0.6875rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase",
            )}
          >
            {forecast.eyebrow}
          </p>
          <p className={cn("mt-1 flex min-w-0 items-baseline gap-2")}>
            <span
              className={cn("truncate text-[1.1875rem] font-semibold tracking-tight")}
            >
              {forecast.place}
            </span>
            <span className={cn("truncate text-sm font-medium text-muted-foreground")}>
              {forecast.region}
            </span>
          </p>

          <div
            className={cn(
              "mt-5 flex items-center justify-between gap-4",
              "sm:mt-auto sm:justify-start sm:gap-3 sm:pt-5",
            )}
          >
            <p className={cn("flex items-start")}>
              <span
                className={cn(
                  "text-[4rem] leading-[0.8] font-light tracking-[-0.05em] tabular-nums",
                )}
              >
                {forecast.temperature}
              </span>
              <span className={cn("ml-1 text-lg font-normal text-muted-foreground")}>
                {unit}
              </span>
            </p>
            <WeatherGlyph icon={today} className={cn("size-11 sm:size-9")} />
          </div>

          <p className={cn("mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1")}>
            <span className={cn("text-[0.9375rem] font-medium text-foreground/90")}>
              {forecast.condition}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums",
              )}
            >
              <Icon name="clock" tone="current" size={13} />
              {forecast.local}
            </span>
          </p>
        </div>

        {/* 2 — humidity / wind / UV, then five days */}
        <div data-forecast-detail className={cn("min-w-0")}>
          <dl
            className={cn(
              "grid grid-cols-3 gap-2 rounded-2xl bg-ink-900/5 px-3.5 py-3",
            )}
          >
            {forecast.metrics.map((metric) => (
              <div key={metric.label} className={cn("min-w-0")}>
                <dt
                  className={cn(
                    "truncate text-[0.625rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase",
                  )}
                >
                  {metric.label}
                </dt>
                <dd
                  className={cn(
                    "mt-1 truncate text-[0.8125rem] font-semibold text-foreground tabular-nums sm:text-sm",
                  )}
                >
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Fixed 5-column grid so it can never wrap. */}
          <ul className={cn("mt-2 grid grid-cols-5 gap-1")}>
            {forecast.days.map((day, index) => (
              <li
                key={day.day}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl py-2.5",
                  index === 0 && "bg-ink-900/6",
                )}
              >
                <span
                  className={cn(
                    "text-[0.625rem] font-semibold tracking-[0.14em] uppercase",
                    index === 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {day.day}
                </span>
                <WeatherGlyph icon={day.icon} className={cn("size-5.5")} />
                {/* Screen readers get the units; sighted readers get the glyph. */}
                <span className={cn("sr-only")}>
                  {`High ${day.high}${unit}, low ${day.low}${unit}`}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex items-baseline gap-1 text-[0.8125rem] tabular-nums",
                  )}
                >
                  <span className={cn("font-semibold text-foreground")}>
                    {day.high}&deg;
                  </span>
                  <span className={cn("text-muted-foreground")}>{day.low}&deg;</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3 — the note, in a footer band; its spark is the card's one brand accent */}
      <p
        data-forecast-note
        className={cn(
          "flex items-start gap-2.5 bg-ink-900/4 px-5 py-3.5 sm:px-6",
          "text-[0.78rem] leading-snug font-medium text-muted-foreground",
        )}
      >
        {/* The note can wrap, so the glyph pins to the first line rather than
            floating in the middle of the block. */}
        <Icon name="sparkle" size={14} className={cn("mt-px shrink-0")} />
        <span className={cn("min-w-0")}>{forecast.note}</span>
      </p>
    </div>
  );
}
