"use client";

import * as React from "react";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { journey } from "@/content/landing";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

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

  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;

    // The rail fills as the list scrolls through the viewport.
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
          },
        },
      );
    }

    // One trigger per step so they arrive one after another, not together.
    gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
      const dir = step.dataset.flipped === "true" ? -1 : 1;

      gsap.from(step.querySelectorAll("[data-step-part]"), {
        y: 46,
        x: 14 * dir,
        autoAlpha: 0,
        duration: 1,
        stagger: 0.12,
        ease: "expo.out",
        scrollTrigger: { trigger: step, start: "top 82%", once: true },
      });

      gsap.from(step.querySelector("[data-step-node]"), {
        scale: 0,
        duration: 0.7,
        ease: "back.out(2.4)",
        scrollTrigger: { trigger: step, start: "top 82%", once: true },
      });
    });
  }, []);

  return (
    <section id="journey" className="py-4">
      <Container size="panel" gutter="sm">
        <div
          ref={scopeRef as React.Ref<HTMLDivElement>}
          className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#0a0705_0%,#fde063_15%,#fccc2e_32%,#e9a10f_48%,#a85f08_64%,#4a2606_80%,#160d05_92%,#0a0705_100%)] px-5 py-16 sm:px-10 lg:rounded-[2.5rem] lg:px-14 lg:py-24"
        >
          {/* Warms the yellow at the top and deepens the black at the base. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_45%_at_50%_0%,rgba(0,0,0,0.55),transparent_66%),radial-gradient(90%_45%_at_50%_100%,rgba(0,0,0,0.5),transparent_70%)]"
          />

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
              className="absolute inset-y-2 left-[11px] w-px bg-[linear-gradient(180deg,rgba(255,255,255,0.30)_0%,rgba(10,7,5,0.22)_14%,rgba(10,7,5,0.22)_66%,rgba(255,255,255,0.22)_86%,rgba(255,255,255,0.30)_100%)] lg:left-1/2 lg:-translate-x-1/2"
            >
              <span
                ref={railRef}
                className="absolute inset-0 origin-top bg-[linear-gradient(180deg,rgba(255,255,255,0.70)_0%,rgba(10,7,5,0.50)_14%,rgba(10,7,5,0.50)_66%,rgba(255,255,255,0.55)_86%,rgba(255,255,255,0.70)_100%)]"
              />
            </span>

            {journey.steps.map((step, i) => {
              const flipped = i % 2 === 1;
              // Steps 1–2 sit on yellow, 3–4 on the dark end of the gradient.
              const onDark = i >= journey.steps.length / 2;

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
                          "mt-6 aspect-[4/3] w-full max-w-[380px] rounded-2xl",
                          "shadow-[0_2px_10px_-2px_rgba(20,14,4,0.35),0_26px_50px_-26px_rgba(10,8,3,0.6)]",
                          onDark ? "ring-1 ring-white/20" : "ring-1 ring-ink-950/10",
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
