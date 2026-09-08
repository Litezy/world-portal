"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { HeroForecastCard } from "@/components/sections/hero-forecast-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { hero } from "@/content/landing";
import { useGsap } from "@/hooks/use-gsap";
import { useIdleMount } from "@/hooks/use-idle-mount";
import { EASE_GLASS, gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

// WebGL is an enhancement layered over the real <Image>, so it must never
// block first paint or run on the server.
const HeroWebgl = dynamic(
  () => import("@/components/motion/hero-webgl").then((m) => m.HeroWebgl),
  { ssr: false },
);

/**
 * Full-bleed photograph under a dark scrim, carrying a two-column layout: the
 * badge / heading / lead / CTA stack on the left, and the forecast card sitting
 * low on the right.
 *
 * The copy stack staggers in on load and the card settles in just behind it,
 * then drifts a little slower than the page as the hero scrolls away.
 */
export function Hero() {
  const webglReady = useIdleMount();

  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;

    const tl = gsap.timeline({ delay: 0.15 });

    tl.from("[data-hero-stack] > *", {
      y: 22,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: EASE_GLASS,
    }).from(
      "[data-hero-forecast]",
      {
        y: 28,
        autoAlpha: 0,
        duration: 1,
        ease: EASE_GLASS,
      },
      // Overlaps the tail of the stagger so the card lands just behind the copy.
      "-=0.55",
    );

    // Afterwards the card drifts a little slower than the page.
    gsap.to("[data-hero-forecast]", {
      yPercent: -6,
      ease: "none",
      scrollTrigger: {
        trigger: scope,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, []);

  return (
    <section
      ref={scopeRef as React.Ref<HTMLElement>}
      className={cn("relative isolate min-h-[92vh] overflow-hidden lg:min-h-screen")}
    >
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        priority
        sizes="100vw"
        className="-z-30 object-cover"
      />

      {webglReady ? (
        <HeroWebgl src={hero.image.src} className="absolute inset-0 -z-20 size-full" />
      ) : null}

      {/* Dark scrim: an even wash so no part of the photograph competes with
          the type, plus a gradient that deepens under the header and along the
          bottom edge. Tuned so the lagoon still reads clearly underneath. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink-950/28" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,9,14,0.55)_0%,rgba(6,9,14,0.16)_28%,rgba(6,9,14,0.14)_54%,rgba(6,9,14,0.52)_100%)]"
      />

      <Container
        size="content"
        className={cn(
          "grid min-h-[92vh] grid-cols-1 items-center gap-8 pt-28 pb-12 sm:gap-10 sm:pb-14",
          "lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-10 lg:pb-20",
        )}
      >
        <div
          data-hero-stack
          className={cn(
            "flex max-w-xl flex-col items-center text-center",
            "lg:items-start lg:self-center lg:text-left",
          )}
        >
          <Badge variant="glassDark" size="md" dot dotClassName="bg-primary">
            {hero.badge}
          </Badge>

          <SectionHeading
            as="h1"
            size="lg"
            onDark
            align="left"
            lead={hero.headingLead}
            accent={hero.headingAccent}
            className="mt-6 items-center text-center lg:items-start lg:text-left"
          />

          <p className="mt-5 text-[15px] leading-relaxed text-balance text-white/90 sm:text-[17px]">
            {hero.lead}
          </p>

          <div
            className={cn(
              "mt-8 flex flex-wrap items-center justify-center gap-3",
              "lg:justify-start",
            )}
          >
            <Button asChild variant="primary" size="lg">
              <Link href={hero.cta.href}>{hero.cta.label}</Link>
            </Button>
            <Button asChild variant="glassDark" size="lg">
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>

        <HeroForecastCard
          className={cn(
            "w-full max-w-sm justify-self-center",
            "lg:max-w-none lg:self-end lg:justify-self-end",
          )}
        />
      </Container>
    </section>
  );
}
