"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { journey } from "@/content/landing";
import { useGsap } from "@/hooks/use-gsap";
import { useIdleMount } from "@/hooks/use-idle-mount";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

// Decoration only — never let it block first paint.
const JourneyWebgl = dynamic(
  () => import("@/components/motion/journey-webgl").then((m) => m.JourneyWebgl),
  { ssr: false },
);

/**
 * The shared process, on a panel that opens near-black, passes through the
 * brand yellow as a lit band, and closes near-black again.
 *
 * Each step lifts into place on its own trigger rather than as one batch, so
 * the four arrive in sequence as you scroll. The rail between them fills to
 * track how far through the process you have read.
 *
 * The first two steps sit on the yellow band and take ink type; the last two
 * sit on the dark end and take white — `onDark` below is derived from the
 * index, so adding a fifth step keeps the contrast correct automatically.
 */
export function Journey() {
  const railRef = React.useRef<HTMLSpanElement>(null);
  const webglReady = useIdleMount();
  // Written by ScrollTrigger, read by the WebGL trail every frame, so both
  // directions stay on one clock.
  const progressRef = React.useRef(0);

  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;

    // One scrubbed trigger drives both the rail and the WebGL trail, so
    // scrolling back up rewinds them rather than leaving them filled.
    if (railRef.current) {
      gsap.fromTo(
        railRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: railRef.current.parentElement,
            start: "top 72%",
            end: "bottom 72%",
            scrub: 0.5,
            onUpdate: (self) => {
              progressRef.current = self.progress;
            },
          },
        },
      );
    }

    /**
     * Each step is scrubbed across a short window rather than fired once, so
     * the whole section plays in reverse on the way back up — the steps drop
     * away in the order they arrived instead of staying frozen in place.
     */
    gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
      const dir = step.dataset.flipped === "true" ? -1 : 1;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: step,
            start: "top 88%",
            end: "top 52%",
            scrub: 0.6,
          },
        })
        .fromTo(
          step.querySelector("[data-step-node]"),
          { scale: 0.2, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, ease: "back.out(2.2)", duration: 0.5 },
          0,
        )
        .fromTo(
          step.querySelectorAll("[data-step-part]"),
          { y: 52, x: 18 * dir, autoAlpha: 0 },
          {
            y: 0,
            x: 0,
            autoAlpha: 1,
            ease: "power3.out",
            duration: 1,
            stagger: 0.14,
          },
          0.05,
        );
    });
  }, []);

  return (
    <section id="journey" className="py-4">
      <Container size="panel" gutter="sm">
        <div
          ref={scopeRef as React.Ref<HTMLDivElement>}
          className="grain relative isolate overflow-hidden rounded-[2rem] bg-[#061024] px-5 py-16 sm:px-10 lg:rounded-[2.5rem] lg:px-14 lg:py-24"
        >
          {/*
            The panel used to be one tall multi-stop gradient, which banded into
            visible stripes and read as flat. It is now three layers: a night
            photograph for texture, a softer four-stop wash for the brand
            colour, and two off-centre glows so the light has a direction. The
            `grain` class dithers the whole thing so no band survives.
          */}
          <Image
            src={journey.background.src}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1420px"
            className="-z-30 object-cover opacity-45"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(6,16,36,0.94)_0%,rgba(10,63,150,0.80)_28%,rgba(13,96,186,0.72)_50%,rgba(8,52,116,0.86)_74%,rgba(5,11,24,0.97)_100%)]"
          />
          {/* Warms the yellow at the top and deepens the black at the base. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_38%_at_78%_22%,rgba(1,186,246,0.30),transparent_62%),radial-gradient(55%_34%_at_18%_58%,rgba(47,110,240,0.26),transparent_66%),radial-gradient(130%_44%_at_50%_0%,rgba(3,8,20,0.72),transparent_60%),radial-gradient(110%_40%_at_50%_100%,rgba(3,8,20,0.80),transparent_64%)]"
          />

          {webglReady ? (
            <JourneyWebgl
              progressRef={progressRef}
              className="pointer-events-none absolute inset-0 -z-10 size-full opacity-70 mix-blend-screen"
            />
          ) : null}

          <SectionHeading
            eyebrow={journey.eyebrow}
            lead={journey.headingLead}
            accent={journey.headingAccent}
            body={journey.body}
            align="center"
            onDark
            size="md"
            className="mx-auto max-w-xl"
          />

          <ol className="relative mx-auto mt-16 max-w-4xl">
            {/* Rail track, plus the fill that tracks scroll progress. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-2 left-[11px] w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.30)_0%,rgba(4,20,44,0.30)_14%,rgba(4,20,44,0.30)_66%,rgba(255,255,255,0.22)_86%,rgba(255,255,255,0.30)_100%)] lg:left-1/2 lg:-translate-x-1/2"
            >
              <span
                ref={railRef}
                className="absolute inset-0 origin-top bg-[linear-gradient(180deg,rgba(255,255,255,0.70)_0%,rgba(4,20,44,0.58)_14%,rgba(4,20,44,0.58)_66%,rgba(255,255,255,0.55)_86%,rgba(255,255,255,0.70)_100%)]"
              />
            </span>

            {journey.steps.map((step, i) => {
              const flipped = i % 2 === 1;
              // The panel is blue top to bottom now, so every step is light
              // type — no half-way flip to keep in sync with the gradient.
              const onDark = true;

              return (
                <li
                  key={step.day}
                  data-step
                  data-flipped={flipped}
                  className={cn(
                    "relative pb-14 pl-10 last:pb-0",
                    "lg:grid lg:grid-cols-2 lg:items-start lg:gap-16 lg:pl-0",
                  )}
                >
                  <span
                    data-step-node
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1.5 left-0 z-10 size-[22px] rounded-full border-[5px] lg:left-1/2 lg:-translate-x-1/2",
                      onDark
                        ? "border-white/85 bg-white/25"
                        : "border-ink-950/80 bg-ink-950/15",
                    )}
                  />

                  <span
                    data-step-part
                    aria-hidden="true"
                    className={cn(
                      "heading-serif absolute -top-2 left-10 text-[34px] leading-none lg:static lg:text-[42px]",
                      onDark ? "text-white/75" : "text-ink-950/55",
                      flipped
                        ? "lg:col-start-2 lg:row-start-1 lg:justify-self-start lg:pt-1 lg:pl-2"
                        : "lg:col-start-1 lg:row-start-1 lg:justify-self-end lg:pt-1 lg:pr-2",
                    )}
                  >
                    {step.day}
                  </span>

                  <div
                    className={cn(
                      "pt-8 lg:pt-0",
                      flipped
                        ? "lg:col-start-1 lg:row-start-1 lg:text-right"
                        : "lg:col-start-2 lg:row-start-1",
                    )}
                  >
                    <h3
                      data-step-part
                      className={cn(
                        "text-[19px] font-semibold tracking-tight sm:text-xl",
                        onDark ? "text-white" : "text-ink-950",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p
                      data-step-part
                      className={cn(
                        "mt-2.5 max-w-[42ch] text-[13.5px] leading-relaxed",
                        onDark ? "text-white/80" : "text-ink-900/80",
                        flipped && "lg:ml-auto",
                      )}
                    >
                      {step.body}
                    </p>

                    <div
                      data-step-part
                      className={cn(flipped && "lg:flex lg:justify-end")}
                    >
                      <ParallaxImage
                        src={step.image.src}
                        alt={step.image.alt}
                        fill
                        sizes="(max-width: 1024px) 88vw, 380px"
                        strength={16}
                        className={cn(
                          "tint-brand mt-6 aspect-[4/3] w-full max-w-[380px] rounded-2xl",
                          "shadow-[0_2px_10px_-2px_rgba(20,14,4,0.35),0_26px_50px_-26px_rgba(10,8,3,0.6)]",
                          "ring-1 ring-white/15",
                        )}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-14 flex justify-center">
            <Button asChild variant="primary" size="lg">
              <Link href={journey.cta.href}>
                {journey.cta.label}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
