import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { visas } from "@/content/landing";

/**
 * Service 1 — the three routes into a visa, sold on how little the traveller
 * has to do. Each card carries its own turnaround time as a badge, because
 * "how long" is the first thing anyone actually wants to know.
 */
export function Visas() {
  return (
    <Section id="visas" spacing="md">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={visas.eyebrow}
            lead={visas.headingLead}
            accent={visas.headingAccent}
            body={visas.body}
            size="md"
            className="max-w-xl"
          />
          <Button
            asChild
            variant="primary"
            size="md"
            className="shrink-0 self-start sm:self-end"
          >
            <Link href={visas.cta.href}>
              {visas.cta.label}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <Reveal
          stagger={0.14}
          as="ul"
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visas.items.map((item) => (
            <li key={item.name}>
              <article className="group relative isolate aspect-[3/4] overflow-hidden rounded-[1.75rem]">
                <ParallaxImage
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 380px"
                  strength={14}
                  className="absolute inset-0 -z-20"
                  imageClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,10,14,0.34)_0%,rgba(8,10,14,0.14)_30%,rgba(8,10,14,0.72)_62%,rgba(8,10,14,0.93)_100%)]"
                />

                <div className="absolute inset-x-0 top-0 p-6">
                  <Badge variant="glassDark" size="sm">
                    {item.tag}
                  </Badge>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-[20px] font-semibold tracking-tight text-white">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                    {item.body}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
