"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { playMockup } from "@/components/sections/journey-mockups";
import {
  JourneySceneFrame,
  JourneyStage,
  stepState,
} from "@/components/sections/journey-stage";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { journey } from "@/content/landing";
import { Icon } from "@/ds/components/icon";
import { useGsap } from "@/hooks/use-gsap";
import { useIdleMount } from "@/hooks/use-idle-mount";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

// Decoration only — never let it block first paint.
const JourneyWebgl = dynamic(
  () => import("@/components/motion/journey-webgl").then((m) => m.JourneyWebgl),
  { ssr: false },
);

/**
 * The pinned layout's media query. The CSS side is every `lg:motion-safe:`
 * class below; useGsap already refuses to run under reduced motion, so the
 * two always agree on which layout is showing.
 */
const PINNED = "(min-width: 1024px)";
const STACKED = "(max-width: 1023.98px)";

/**
 * How It Works: one example trip, Lagos to Dubai, played through the four
 * steps on a live mock-up.
 *
 * - **lg+, motion allowed:** the track is ~360vh tall and the layered blue
 *   panel is `position: sticky` inside it, filling the viewport under the
 *   fixed header. Copy and a vertical step list on the left, the stage on the
 *   right. One scrubbed timeline spans the whole pin: the step changes as
 *   progress crosses each quarter, and inside each quarter that step's
 *   mock-up plays out with progress, so scrolling back up rewinds it.
 * - **Below lg, or reduced motion at any width:** no pin. The steps stack,
 *   each with its mock-up on its photograph in its final state, with a
 *   simple scrubbed reveal on phones and none at all under reduced motion.
 *
 * Every mock-up renders final by default, so the section reads correctly if
 * no animation ever runs (reduced motion, a hidden tab). The data is sample
 * data from `journey.demo` and the stage says so ("Example trip").
 *
 * The panel follows the page theme: a daylight sky panel with ink type in
 * light (the default), the night-blue panel with white type in dark. The
 * mock-ups are kit cards and follow it too.
 */
export function Journey() {
  const webglReady = useIdleMount();
  // Written by ScrollTrigger, read by the WebGL trail every frame, so both
  // directions stay on one clock.
  const progressRef = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const activeRef = React.useRef(0);

  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;
    const rows = gsap.utils.toArray<HTMLElement>("[data-step]", scope);
    const list = scope.querySelector<HTMLElement>("[data-journey-list]");
    if (!rows.length || !list) return;
    const count = rows.length;
    const last = count - 1;
    const parts = rows.map((row) => row.querySelector("[data-step-part]"));

    const mm = gsap.matchMedia();

    mm.add(PINNED, () => {
      const track = scope.querySelector<HTMLElement>("[data-journey-track]");
      const panel = scope.querySelector<HTMLElement>("[data-journey-panel]");
      const stage = scope.querySelector<HTMLElement>("[data-journey-stage]");
      const sizer = scope.querySelector<HTMLElement>("[data-journey-sizer]");
      const fill = scope.querySelector<HTMLElement>("[data-journey-rail-fill]");
      if (!track || !panel || !stage || !sizer || !fill) return;

      // Arrival, while the panel scrolls up to its pin: the rows, then the stage.
      gsap.fromTo(
        parts,
        { y: 28, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          ease: "power3.out",
          stagger: 0.14,
          scrollTrigger: {
            trigger: track,
            start: "top 88%",
            end: "top 32%",
            scrub: 0.6,
          },
        },
      );
      gsap.fromTo(
        stage,
        { y: 56, autoAlpha: 0, scale: 0.96 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: track,
            start: "top 96%",
            end: "top 40%",
            scrub: 0.6,
          },
        },
      );

      /*
       * The active row's body opens under it, and the rows after it move down
       * by `--journey-slot` (a transform, never a height change). The slot is
       * the tallest body, measured by the invisible sizer at the foot of the
       * list. The rail's fill follows the head of the trip: from the active
       * node, down past its body, to where the next node sits.
       */
      let pitch = 0;
      let slot = 0;
      let progress = 0;
      const measure = () => {
        pitch = rows[0]?.offsetHeight ?? 0;
        slot = sizer.offsetHeight;
        list.style.setProperty("--journey-slot", `${slot}px`);
      };
      const railTarget = () => {
        const length = last * pitch + slot;
        if (!length) return 0;
        const at = Math.min(progress * count, count);
        const step = Math.min(Math.floor(at), last);
        const within = at - step;
        const reached =
          step < last
            ? step * pitch + within * (pitch + slot)
            : last * pitch + within * slot;
        return reached / length;
      };
      gsap.set(fill, { scaleY: 0 });
      const fillTo = gsap.quickTo(fill, "scaleY", {
        duration: 0.5,
        ease: "power3.out",
      });
      measure();
      const resize = new ResizeObserver(() => {
        measure();
        fillTo(railTarget());
      });
      resize.observe(sizer);

      const stickyTop = () => parseFloat(getComputedStyle(panel).top) || 0;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: track,
          // Exactly the span the panel is stuck for.
          start: () => `top ${stickyTop()}px`,
          end: () => `bottom ${stickyTop() + panel.offsetHeight}px`,
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progress = self.progress;
            progressRef.current = self.progress;
            const next = Math.min(last, Math.floor(self.progress * count));
            if (next !== activeRef.current) {
              activeRef.current = next;
              setActive(next);
            }
            fillTo(railTarget());
          },
        },
      });

      // One unit of timeline per step: the card drifts against the photo,
      // and its mock-up plays out inside the unit.
      gsap.utils.toArray<HTMLElement>("[data-scene]", stage).forEach((scene, i) => {
        tl.fromTo(
          scene.querySelector("[data-scene-drift]"),
          { y: 16 },
          { y: -16, duration: 1 },
          i,
        );
        playMockup(tl, scene, i, i);
      });
      tl.fromTo(
        stage.querySelector("[data-stage-photos]"),
        { yPercent: -4 },
        { yPercent: 4, duration: count },
        0,
      )
        .fromTo(
          stage.querySelector('[data-fp="fill"]'),
          { scaleX: 0 },
          { scaleX: 1, duration: count },
          0,
        )
        .fromTo(
          stage.querySelector('[data-fp="plane"]'),
          { xPercent: 0 },
          { xPercent: 100, duration: count },
          0,
        )
        .set({}, {}, count);

      return () => {
        resize.disconnect();
        list.style.removeProperty("--journey-slot");
      };
    });

    mm.add(STACKED, () => {
      // The trail draws down the panel as the steps go by.
      ScrollTrigger.create({
        trigger: list,
        start: "top 72%",
        end: "bottom 72%",
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });

      rows.forEach((row) => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: row,
              start: "top 88%",
              end: "top 55%",
              scrub: 0.6,
            },
          })
          .fromTo(
            row.querySelector("[data-step-node]"),
            { scale: 0.2, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, ease: "back.out(2.2)", duration: 0.5 },
            0,
          )
          .fromTo(
            row.querySelector("[data-step-part]"),
            { y: 40, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, ease: "power3.out", duration: 1 },
            0.05,
          );

        const scene = row.querySelector("[data-step-scene]");
        if (scene) {
          gsap.fromTo(
            scene,
            { y: 64, autoAlpha: 0, scale: 0.96 },
            {
              y: 0,
              autoAlpha: 1,
              scale: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: scene,
                start: "top 96%",
                end: "top 62%",
                scrub: 0.6,
              },
            },
          );
        }
      });
    });
  }, []);

  return (
    <section
      ref={scopeRef as React.Ref<HTMLElement>}
      id="journey"
      className={cn("py-4")}
    >
      <Container size="panel" gutter="sm">
        {/* The scroll track the pinned panel rides (desktop, motion allowed). */}
        <div data-journey-track className={cn("lg:motion-safe:h-[360vh]")}>
          <div
            data-journey-panel
            data-brand="e-embassy"
            className={cn(
              "grain relative isolate overflow-hidden rounded-[2rem] bg-brand-50 px-4 py-14 sm:px-8 sm:py-16 dark:bg-[#061024]",
              "lg:rounded-[2.5rem] lg:px-12 lg:py-20",
              // On the light page the daylight panel sits on a soft navy shadow,
              // so it reads as an island lifted off the paper.
              "shadow-[0_44px_90px_-56px_rgb(0_40_120/0.38),0_2px_6px_-2px_rgb(0_40_120/0.12)] dark:shadow-none",
              // Pinned: sticks under the fixed header (6rem at lg) and fills the
              // rest of the viewport, with a floor for short windows.
              "lg:motion-safe:sticky lg:motion-safe:top-24 lg:motion-safe:h-[calc(100svh-7rem)]",
              "lg:motion-safe:max-h-[60rem] lg:motion-safe:min-h-[34rem]",
              "lg:motion-safe:px-10 lg:motion-safe:py-8 xl:motion-safe:px-12 xl:motion-safe:py-10",
            )}
          >
            {/*
              The panel used to be one tall multi-stop gradient, which banded into
              visible stripes and read as flat. It is now four layers: a
              photograph for texture (the hero's daylight sky in light, a night
              sky in dark), a softer four-stop wash for the brand colour, two
              off-centre glows so the light has a direction, and the `grain`
              class, which dithers the whole thing so no band survives.
            */}
            {/* Wrapped: next/image's `fill` wants a relative or absolute
                parent, and the panel itself is sticky when pinned. Each theme
                hides the other's photograph, and a lazy image that is
                display:none is never fetched. */}
            <div
              aria-hidden="true"
              className={cn("absolute inset-0 -z-30 dark:hidden")}
            >
              <Image
                src={journey.backgroundDay.src}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 1420px"
                className={cn("object-cover opacity-60")}
              />
            </div>
            <div
              aria-hidden="true"
              className={cn("absolute inset-0 -z-30 hidden dark:block")}
            >
              <Image
                src={journey.background.src}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 1420px"
                className={cn("object-cover opacity-45")}
              />
            </div>
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(238,244,255,0.9)_0%,rgba(216,230,255,0.66)_32%,rgba(204,236,255,0.6)_58%,rgba(238,244,255,0.92)_100%)]",
                "dark:bg-[linear-gradient(180deg,rgba(6,16,36,0.94)_0%,rgba(10,63,150,0.80)_30%,rgba(13,96,186,0.72)_55%,rgba(8,52,116,0.86)_80%,rgba(5,11,24,0.97)_100%)]",
              )}
            />
            {/* Cyan light from the top right, a softer blue pool lower left. */}
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_50%_at_82%_8%,rgba(1,186,246,0.2),transparent_62%),radial-gradient(50%_55%_at_12%_78%,rgba(47,110,240,0.12),transparent_66%)]",
                "dark:bg-[radial-gradient(55%_50%_at_82%_8%,rgba(1,186,246,0.30),transparent_62%),radial-gradient(50%_55%_at_12%_78%,rgba(47,110,240,0.26),transparent_66%),radial-gradient(130%_50%_at_50%_0%,rgba(3,8,20,0.6),transparent_60%),radial-gradient(110%_45%_at_50%_100%,rgba(3,8,20,0.75),transparent_64%)]",
              )}
            />

            {webglReady ? (
              <JourneyWebgl
                progressRef={progressRef}
                className={cn(
                  // Screen brightens the night panel; on the pale day panel a
                  // screen blend would vanish, so the trail multiplies there.
                  "pointer-events-none absolute inset-0 -z-10 size-full opacity-70 mix-blend-multiply dark:mix-blend-screen",
                )}
              />
            ) : null}

            {/* Above the grain overlay, so cards and photographs stay crisp. */}
            <div
              className={cn(
                // minmax(0, 1fr): an `auto` column grows to the widest mock-up's
                // min-content and pushes the copy past the panel on phones.
                "relative z-[1] grid grid-cols-[minmax(0,1fr)] gap-y-12",
                "[grid-template-areas:'head'_'steps'_'cta']",
                // lg, reduced motion: heading beside the CTA, step rows below.
                "lg:motion-reduce:grid-cols-[minmax(0,1fr)_auto] lg:motion-reduce:gap-x-12 lg:motion-reduce:gap-y-14",
                "lg:motion-reduce:[grid-template-areas:'head_cta'_'steps_steps']",
                // lg, pinned: the copy column on the left, the stage on the right.
                "lg:motion-safe:h-full lg:motion-safe:min-h-0 lg:motion-safe:gap-x-12 lg:motion-safe:gap-y-0 xl:motion-safe:gap-x-16",
                "lg:motion-safe:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:motion-safe:grid-rows-[auto_minmax(0,1fr)_auto]",
                "lg:motion-safe:[grid-template-areas:'head_stage'_'steps_stage'_'cta_stage']",
              )}
            >
              <SectionHeading
                eyebrow={journey.eyebrow}
                lead={journey.headingLead}
                accent={journey.headingAccent}
                body={journey.body}
                size="md"
                className={cn("max-w-2xl [grid-area:head]")}
              />

              {/* The mock-ups are aria-hidden illustrations; this says what they show. */}
              <p className={cn("sr-only")}>{journey.demo.description}</p>

              <ol
                data-journey-list
                className={cn(
                  "relative grid grid-cols-[minmax(0,1fr)] gap-14 [grid-area:steps]",
                  "lg:motion-safe:block lg:motion-safe:self-center lg:motion-safe:py-6 lg:motion-safe:[--journey-slot:5.5rem]",
                )}
              >
                {/* Pinned only: the rail down the node column, filled by progress. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-11 bottom-11 left-3.5 hidden w-px bg-foreground/12 lg:motion-safe:block",
                  )}
                >
                  <span
                    data-journey-rail-fill
                    className={cn(
                      "absolute inset-0 origin-top bg-linear-to-b from-cyan-500 to-brand-600 dark:from-cyan-300 dark:to-white/80",
                    )}
                  />
                </span>

                {journey.steps.map((step, i) => {
                  const number = String(step.day).padStart(2, "0");
                  return (
                    <li
                      key={step.day}
                      data-step
                      data-state={stepState(i, active)}
                      className={cn(
                        "group/step relative",
                        "lg:motion-reduce:grid lg:motion-reduce:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:motion-reduce:items-center lg:motion-reduce:gap-12",
                        // Pinned: rows after the active one make room for its body.
                        "lg:motion-safe:transition-[translate] lg:motion-safe:duration-700 lg:motion-safe:ease-(--cx-spring)",
                        "lg:motion-safe:data-[state=next]:translate-y-(--journey-slot)",
                      )}
                    >
                      <div
                        data-step-part
                        className={cn("relative pl-12 lg:motion-safe:py-2")}
                      >
                        <span
                          data-step-node
                          aria-hidden="true"
                          className={cn(
                            "absolute top-0 left-0 z-10 size-8",
                            "lg:motion-safe:top-1.5 lg:motion-safe:size-7 lg:motion-safe:rounded-full lg:motion-safe:bg-brand-50 dark:lg:motion-safe:bg-brand-950",
                          )}
                        >
                          {/* The stacked look, and the pinned "active" look. */}
                          <span
                            className={cn(
                              "absolute inset-0 grid place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white tabular-nums shadow-[0_0_0_6px_rgb(0_184_248/0.14)] dark:bg-white dark:text-brand-800",
                              "lg:motion-safe:text-[11px] lg:motion-safe:shadow-[0_0_0_5px_rgb(0_184_248/0.2),0_0_22px_rgb(0_184_248/0.5)]",
                              "lg:motion-safe:transition-[opacity,scale] lg:motion-safe:duration-500 lg:motion-safe:ease-(--cx-spring)",
                              "lg:motion-safe:group-data-[state=done]/step:scale-75 lg:motion-safe:group-data-[state=done]/step:opacity-0",
                              "lg:motion-safe:group-data-[state=next]/step:scale-75 lg:motion-safe:group-data-[state=next]/step:opacity-0",
                            )}
                          >
                            {number}
                          </span>
                          {/* Pinned, still to come. */}
                          <span
                            className={cn(
                              "absolute inset-0 hidden place-items-center rounded-full text-[11px] font-bold text-foreground/55 tabular-nums opacity-0 shadow-[inset_0_0_0_1px_rgb(0_40_120/0.22)] dark:text-white/60 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)]",
                              "transition-opacity duration-500 group-data-[state=next]/step:opacity-100 lg:motion-safe:grid",
                            )}
                          >
                            {number}
                          </span>
                          {/* Pinned, done. */}
                          <span
                            className={cn(
                              "absolute inset-0 hidden scale-75 place-items-center rounded-full bg-cyan-300 text-brand-950 opacity-0",
                              "transition-[opacity,scale] duration-500 ease-(--cx-spring) group-data-[state=done]/step:scale-100 group-data-[state=done]/step:opacity-100 lg:motion-safe:grid",
                            )}
                          >
                            <Icon name="check" tone="current" size={14} />
                          </span>
                        </span>

                        <h3
                          className={cn(
                            "text-[18px] leading-snug font-semibold tracking-[-0.02em] text-foreground",
                            "lg:motion-safe:text-[17px] lg:motion-safe:leading-6 lg:motion-safe:transition-opacity lg:motion-safe:duration-500",
                            "lg:motion-safe:group-data-[state=done]/step:opacity-75 lg:motion-safe:group-data-[state=next]/step:opacity-55",
                          )}
                        >
                          {step.title}
                        </h3>
                        <p
                          className={cn(
                            "mt-2 text-[14px] leading-[1.65] text-pretty text-foreground/75",
                            // Pinned: hangs under the title, shown only while active.
                            "lg:motion-safe:pointer-events-none lg:motion-safe:absolute lg:motion-safe:inset-x-0 lg:motion-safe:top-full lg:motion-safe:mt-0 lg:motion-safe:pr-2 lg:motion-safe:pl-12 lg:motion-safe:leading-[1.6]",
                            "lg:motion-safe:translate-y-1.5 lg:motion-safe:opacity-0 lg:motion-safe:blur-[3px]",
                            "lg:motion-safe:transition-[opacity,translate,filter] lg:motion-safe:duration-500 lg:motion-safe:ease-cx",
                            "lg:motion-safe:group-data-[state=active]/step:translate-y-0 lg:motion-safe:group-data-[state=active]/step:opacity-100 lg:motion-safe:group-data-[state=active]/step:blur-[0px]",
                          )}
                        >
                          {step.body}
                        </p>
                      </div>

                      {/* Stacked only: this step's mock-up, final, on its photograph. */}
                      <div
                        data-step-scene
                        className={cn(
                          "mt-6 lg:motion-safe:hidden lg:motion-reduce:mt-0",
                        )}
                      >
                        <JourneySceneFrame index={i} />
                      </div>
                    </li>
                  );
                })}

                {/* Pinned only: invisible, sized by the tallest body. It reserves
                    the slot the open body sits in, and is measured for the shift. */}
                <div
                  data-journey-sizer
                  aria-hidden="true"
                  className={cn("invisible hidden pl-12 lg:motion-safe:grid")}
                >
                  {journey.steps.map((step) => (
                    <p
                      key={step.day}
                      className={cn(
                        "pr-2 pb-3 text-[14px] leading-[1.6] text-pretty [grid-area:1/1]",
                      )}
                    >
                      {step.body}
                    </p>
                  ))}
                </div>
              </ol>

              {/* The one primary on the panel: after the steps on a phone, beside
                  the heading at lg with reduced motion, under the steps when
                  pinned. Pinned below xl it is lifted clear of the fixed Ask
                  Vivid pill (560px, bottom centre), which would cover its end. */}
              <div
                className={cn(
                  "[grid-area:cta] lg:motion-reduce:self-end",
                  "lg:motion-safe:pb-8 xl:motion-safe:pb-0",
                )}
              >
                <Link
                  href={journey.cta.href}
                  className={cn(
                    "cx-btn cx-btn--lg cx-btn--arrow w-full shadow-cta focus-visible:shadow-[var(--cx-focus-ring)] sm:w-auto",
                  )}
                >
                  {journey.cta.label}
                  <Icon name="arrow-right" tone="current" />
                </Link>
              </div>

              {/* Pinned only: the stage the example trip plays out on. */}
              <div
                className={cn("hidden min-h-0 [grid-area:stage] lg:motion-safe:block")}
              >
                <JourneyStage active={active} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
