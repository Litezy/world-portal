"use client";

import * as React from "react";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { flightsHotels } from "@/content/landing";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";

/**
 * Service 2 — sold on speed. The two image rows slide horizontally in
 * opposite directions as the section passes the viewport: scroll-linked, not a
 * carousel, so there is nothing to click and nothing that can sit still.
 *
 * Each row renders its images twice so there is always material either side of
 * the travel range and no edge is ever exposed.
 */
export function FlightsHotels() {
  const topRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;

    const trigger = {
      trigger: scope,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.8,
    };

    if (topRef.current) {
      gsap.fromTo(
        topRef.current,
        { xPercent: 0 },
        { xPercent: -28, ease: "none", scrollTrigger: trigger },
      );
    }
    if (bottomRef.current) {
      gsap.fromTo(
        bottomRef.current,
        { xPercent: -28 },
        { xPercent: 0, ease: "none", scrollTrigger: trigger },
      );
    }
  }, []);

  return (
    <Section id="flights-hotels" spacing="md" className="overflow-hidden">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={flightsHotels.eyebrow}
            lead={flightsHotels.headingLead}
            accent={flightsHotels.headingAccent}
            body={flightsHotels.body}
            size="md"
            className="max-w-xl"
          />
          <Button
            asChild
            variant="primary"
            size="md"
            className="shrink-0 self-start sm:self-end"
          >
            <Link href={flightsHotels.cta.href}>
              {flightsHotels.cta.label}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>

      <div
        ref={scopeRef as React.Ref<HTMLDivElement>}
        className="mt-12 flex flex-col gap-4 sm:gap-5"
      >
        <MarqueeRow trackRef={topRef} items={flightsHotels.marqueeTop} />
        <MarqueeRow trackRef={bottomRef} items={flightsHotels.marqueeBottom} />
      </div>

      <Container>
        <Reveal
          stagger={0.1}
          as="dl"
          className="mt-14 grid gap-8 border-t border-border pt-10 sm:grid-cols-3"
        >
          {flightsHotels.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="heading-serif text-[38px] leading-none font-normal text-ink-900">
                {stat.value}
              </dt>
              <dd className="mt-2 text-[13.5px] text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

function MarqueeRow({
  items,
  trackRef,
}: {
  items: readonly { src: string; alt: string }[];
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="w-full overflow-hidden">
      <div ref={trackRef} className="flex w-max gap-4 will-change-transform sm:gap-5">
        {/* Duplicated so the row still covers the viewport at either extreme of
            its travel. The copy is decorative, so it is hidden from AT. */}
        {[...items, ...items].map((item, i) => (
          <ParallaxImage
            key={`${item.src}-${i}`}
            src={item.src}
            alt={i < items.length ? item.alt : ""}
            aria-hidden={i >= items.length || undefined}
            fill
            sizes="(max-width: 640px) 62vw, 420px"
            strength={8}
            className="h-[210px] w-[300px] shrink-0 rounded-2xl sm:h-[260px] sm:w-[400px]"
          />
        ))}
      </div>
    </div>
  );
}
