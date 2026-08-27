"use client";

import * as React from "react";
import Image from "next/image";

import useEmblaCarousel from "embla-carousel-react";

import { Card } from "@/components/ui/card";
import { CarouselArrows } from "@/components/ui/carousel-arrows";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/content/landing";

export function Testimonials() {
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(true);

  React.useEffect(() => {
    if (!embla) return;
    const sync = () => {
      setCanPrev(embla.canScrollPrev());
      setCanNext(embla.canScrollNext());
    };
    sync();
    embla.on("select", sync).on("reInit", sync);
    return () => {
      embla.off("select", sync).off("reInit", sync);
    };
  }, [embla]);

  return (
    <Section id="testimonials" spacing="md" tone="muted">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={testimonials.eyebrow}
            lead={testimonials.headingLead}
            accent={testimonials.headingAccent}
            body={testimonials.body}
            size="md"
          />
          <CarouselArrows
            onPrev={() => embla?.scrollPrev()}
            onNext={() => embla?.scrollNext()}
            canPrev={canPrev}
            canNext={canNext}
            label="testimonial"
            className="shrink-0"
          />
        </div>
      </Container>

      <div
        className="mt-12 overflow-hidden pl-5 sm:pl-8 lg:pl-[max(2rem,calc((100vw-1200px)/2+2rem))]"
        ref={emblaRef}
      >
        <ul className="flex touch-pan-y">
          {testimonials.items.map((t) => (
            <li
              key={t.name}
              className="min-w-0 shrink-0 grow-0 basis-[82%] pr-4 sm:basis-[46%] lg:basis-[31%] lg:pr-5"
            >
              <Card
                variant="solid"
                radius="xl"
                padding="none"
                className="h-full justify-between gap-8 p-6"
              >
                <div>
                  <span className="relative block size-11 overflow-hidden rounded-full">
                    <Image
                      src={t.avatar}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </span>
                  <blockquote className="mt-5 text-[14.5px] leading-relaxed text-ink-800">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>
                <footer>
                  <p className="text-[13.5px] font-semibold text-ink-900">{t.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {t.location}
                  </p>
                </footer>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
