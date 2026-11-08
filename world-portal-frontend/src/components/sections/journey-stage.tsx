import * as React from "react";
import Image from "next/image";

import { JOURNEY_MOCKUPS, PlaneGlyph } from "@/components/sections/journey-mockups";
import { journey } from "@/content/landing";
import { Card } from "@/ds/components/card";
import { Chip } from "@/ds/components/chip";
import { cn } from "@/lib/utils";

export type StepState = "done" | "active" | "next";

/** Where step `index` stands when step `active` is the one playing. */
export function stepState(index: number, active: number): StepState {
  if (index < active) return "done";
  return index === active ? "active" : "next";
}

const { demo, steps } = journey;

/**
 * Dims each photograph so a card and white type sit on it, light falling from
 * the top. Lighter on the day panel, where the photographs should stay bright;
 * the floor stays dark enough for the white flight path in both themes.
 */
const PHOTO_DIM = cn(
  "bg-[linear-gradient(180deg,rgb(3_9_22/0.34)_0%,rgb(3_9_22/0.06)_34%,rgb(3_9_22/0.12)_62%,rgb(3_9_22/0.62)_100%)]",
  "dark:bg-[linear-gradient(180deg,rgb(3_9_22/0.62)_0%,rgb(3_9_22/0.28)_34%,rgb(3_9_22/0.34)_62%,rgb(3_9_22/0.78)_100%)]",
);
const PHOTO_VIGNETTE = cn(
  "bg-[radial-gradient(85%_70%_at_50%_45%,transparent_45%,rgb(3_9_22/0.3)_100%)]",
  "dark:bg-[radial-gradient(85%_70%_at_50%_45%,transparent_40%,rgb(3_9_22/0.55)_100%)]",
);

/**
 * "Example trip", over the photograph: the mock-ups are sample data and the
 * stage must never be read as a real record. The top right stays empty on
 * purpose; step 4's message hangs into it.
 */
function StageChips({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <Chip glass dot className={cn("font-semibold")}>
        {demo.label}
      </Chip>
    </div>
  );
}

/**
 * The trip's flight path: LOS to DXB, a quarter per step, the plane at the
 * point the trip has reached. With `progress` it is drawn static (the stacked
 * layout); without it, the desktop timeline drives `data-fp` itself.
 */
export function FlightPath({
  progress,
  className,
}: {
  progress?: number;
  className?: string;
}) {
  const fixed = progress !== undefined;
  return (
    <div className={cn("flex items-center gap-5 text-white", className)}>
      <span className={cn("text-[11.5px] font-bold tracking-[0.1em] tabular-nums")}>
        {demo.from.code}
      </span>
      <span className={cn("relative h-px flex-1 bg-white/22")}>
        <span
          data-fp="fill"
          className={cn(
            "absolute inset-0 origin-left bg-linear-to-r from-cyan-300 to-white",
          )}
          style={fixed ? { transform: `scaleX(${progress})` } : undefined}
        />
        {[25, 50, 75].map((at) => (
          <span
            key={at}
            className={cn(
              "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45",
            )}
            style={{ left: `${at}%` }}
          />
        ))}
        <span
          data-fp="plane"
          className={cn("absolute inset-x-0 top-1/2")}
          style={
            fixed ? { transform: `translateX(${(progress ?? 0) * 100}%)` } : undefined
          }
        >
          <span
            className={cn(
              "absolute top-0 left-0 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full",
              "bg-[rgb(3_9_22/0.55)] shadow-[0_0_0_1px_rgb(255_255_255/0.18),0_0_18px_rgb(0_184_248/0.45)]",
            )}
          >
            <PlaneGlyph tone="white" className={cn("size-4 rotate-45")} />
          </span>
        </span>
      </span>
      {/* Where the trip is going: the section's one gold touch. */}
      <span className={cn("flex items-center gap-2")}>
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full bg-gold shadow-[0_0_0_3px_var(--color-gold-wash),0_0_10px_var(--color-gold)]",
          )}
        />
        <span className={cn("text-[11.5px] font-bold tracking-[0.1em] tabular-nums")}>
          {demo.to.code}
        </span>
      </span>
    </div>
  );
}

/**
 * The desktop stage (lg+, motion allowed): one corner-lit card, the active
 * step's photograph cross-fading behind it, the four mock-ups stacked in one
 * cell and swapped by `active`. Which one shows is state (`data-state`, CSS
 * transitions on the kit's easing); what happens inside it is scrubbed by the
 * section's timeline.
 */
export function JourneyStage({ active }: { active: number }) {
  return (
    <div
      data-journey-stage
      aria-hidden="true"
      className={cn("relative h-full min-h-0")}
    >
      <Card
        className={cn(
          "h-full gap-0 p-0",
          "shadow-[0_50px_100px_-40px_rgb(0_40_120/0.45),0_0_0_1px_rgb(0_40_120/0.06)]",
          "dark:shadow-[0_50px_100px_-40px_rgb(2_8_23/0.9),0_0_0_1px_rgb(255_255_255/0.06)]",
        )}
      >
        {/* Oversized, so the scrubbed parallax never shows an edge. */}
        <div data-stage-photos className={cn("absolute inset-x-0 -inset-y-[7%] -z-10")}>
          {steps.map((step, i) => (
            <div
              key={step.day}
              data-state={stepState(i, active)}
              className={cn(
                "absolute inset-0 scale-[1.08] opacity-0",
                "transition-[opacity,scale] duration-[1100ms] ease-cx",
                "data-[state=active]:scale-100 data-[state=active]:opacity-100",
              )}
            >
              <div className={cn("tint-brand size-full")}>
                <Image
                  src={step.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1440px) 820px, 58vw"
                  className={cn("object-cover")}
                />
              </div>
            </div>
          ))}
        </div>
        <div className={cn("absolute inset-0 -z-10", PHOTO_DIM)} />
        <div className={cn("absolute inset-0 -z-10", PHOTO_VIGNETTE)} />

        {/* The deeper bottom padding keeps the flight path clear of the site's
            fixed Ask Vivid pill, which sits over the bottom of the pinned panel. */}
        <div
          className={cn(
            "relative flex h-full min-h-0 flex-col p-5 pb-9 xl:p-6 xl:pb-10",
          )}
        >
          <StageChips />

          <div className={cn("relative grid min-h-0 flex-1 place-items-center py-4")}>
            {JOURNEY_MOCKUPS.map((Mockup, i) => (
              <div
                key={i}
                data-scene={i}
                data-state={stepState(i, active)}
                className={cn(
                  "w-[min(100%,23rem)] [grid-area:1/1]",
                  "transition-[opacity,translate,scale,filter] duration-700 ease-cx",
                  "data-[state=done]:-translate-y-8 data-[state=done]:scale-[0.96] data-[state=done]:opacity-0 data-[state=done]:blur-sm",
                  "data-[state=next]:translate-y-10 data-[state=next]:scale-[0.97] data-[state=next]:opacity-0 data-[state=next]:blur-sm",
                )}
              >
                <div data-scene-drift>
                  <Mockup />
                </div>
              </div>
            ))}
          </div>

          <FlightPath className={cn("px-1")} />
        </div>
      </Card>
    </div>
  );
}

/**
 * One step's mock-up on its own photograph, in its final state: the stacked
 * layout (phones, and reduced motion at any width) shows these in place of
 * the pinned stage.
 */
export function JourneySceneFrame({ index }: { index: number }) {
  const step = steps[index];
  const Mockup = JOURNEY_MOCKUPS[index];
  if (!step || !Mockup) return null;

  return (
    <Card aria-hidden="true" className={cn("gap-0 p-0")}>
      <div className={cn("tint-brand absolute inset-0 -z-10")}>
        <Image
          src={step.image.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 56vw, 92vw"
          className={cn("object-cover")}
        />
      </div>
      <div className={cn("absolute inset-0 -z-10", PHOTO_DIM)} />
      <div className={cn("absolute inset-0 -z-10", PHOTO_VIGNETTE)} />

      <div className={cn("flex flex-col gap-6 p-4 sm:p-6")}>
        <StageChips />
        <div className={cn("mx-auto w-full max-w-[23rem] py-2")}>
          <Mockup />
        </div>
        <FlightPath progress={(index + 1) / steps.length} className={cn("px-1")} />
      </div>
    </Card>
  );
}
