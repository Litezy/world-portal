import Link from "next/link";

import { ArrowRight, Check } from "lucide-react";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { ComingSoonNotice } from "@/components/sections/coming-soon";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { experiences } from "@/content/landing";

/** Service 3 — sold on curation, so the imagery does most of the talking. */
export function Experiences() {
  const [a, b, tall, c, d] = experiences.images;

  return (
    <Section id="experiences" spacing="md">
      <Container>
        <SectionHeading
          eyebrow={experiences.eyebrow}
          lead={experiences.headingLead}
          accent={experiences.headingAccent}
          body={experiences.body}
          align="center"
          size="md"
        >
          <ComingSoonNotice notice={experiences.notice} />
        </SectionHeading>

        <Reveal
          stagger={0.08}
          as="ul"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {experiences.highlights.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[13px] font-medium text-ink-800"
            >
              <Check className="size-4 text-primary" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          <div className="grid gap-4 sm:gap-5">
            <Tile image={a} className="aspect-square" strength={14} />
            <Tile image={b} className="aspect-square" strength={8} />
          </div>

          <div className="order-first col-span-2 lg:order-none lg:col-span-1">
            <Tile
              image={tall}
              className="aspect-[4/5] h-full lg:aspect-auto"
              sizes="(max-width: 1024px) 92vw, 380px"
              strength={11}
            />
          </div>

          <div className="grid gap-4 sm:gap-5">
            <Tile image={c} className="aspect-square" strength={8} />
            <Tile image={d} className="aspect-square" strength={14} />
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href={experiences.cta.href}>
              {experiences.cta.label}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function Tile({
  image,
  className,
  strength = 12,
  sizes = "(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 300px",
}: {
  image: { src: string; alt: string };
  className?: string;
  strength?: number;
  sizes?: string;
}) {
  return (
    <ParallaxImage
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      strength={strength}
      className={`group rounded-[1.5rem] ${className ?? ""}`}
      imageClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
    />
  );
}
