import { ArrowUpRight } from "lucide-react";

import { type PictogramName, pictograms } from "@/components/common/pictograms";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { whyUs } from "@/content/landing";

/**
 * Inset rounded panel: a drifting photograph carries the heading on the left
 * while a 2×2 grid of heavily frosted cards overlaps it on the right.
 */
export function WhyUs() {
  return (
    <section id="why-us" className="pb-4">
      <Container size="panel" gutter="sm">
        <div className="relative isolate overflow-hidden rounded-[2rem] lg:rounded-[2.5rem]">
          <ParallaxImage
            src={whyUs.background.src}
            alt={whyUs.background.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 1420px"
            strength={14}
            className="absolute inset-0 -z-20"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(10,14,20,0.62)_0%,rgba(10,14,20,0.34)_45%,rgba(10,14,20,0.18)_100%)]"
          />

          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-12 lg:p-14">
            <SectionHeading
              eyebrow={whyUs.eyebrow}
              lead={whyUs.headingLead}
              accent={whyUs.headingAccent}
              body={whyUs.body}
              onDark
              size="md"
              className="lg:max-w-sm"
            />

            <Reveal
              stagger={0.1}
              as="ul"
              className="grid gap-4 sm:grid-cols-2 sm:gap-5"
            >
              {whyUs.cards.map((card) => {
                const Icon = pictograms[card.icon as PictogramName];
                return (
                  <li key={card.title} className="h-full">
                    <Card
                      variant="ghost"
                      radius="xl"
                      padding="none"
                      interactive
                      className="glass-frost-dark h-full p-6"
                    >
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/25 text-primary ring-1 ring-primary/40 ring-inset">
                        <Icon />
                      </span>

                      <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-white">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-white/75">
                        {card.body}
                      </p>

                      <a
                        href={card.href}
                        className="group/link mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-white underline decoration-current underline-offset-[5px] transition-opacity hover:opacity-70"
                      >
                        {card.cta}
                        <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                      </a>
                    </Card>
                  </li>
                );
              })}
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
