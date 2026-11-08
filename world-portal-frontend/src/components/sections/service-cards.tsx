import Link from "next/link";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/ds/components/card";
import { Chip } from "@/ds/components/chip";
import { Icon, type IconName, IconTile } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

export type ServiceCardItem = {
  name: string;
  /** Turnaround, shown top-left — the first thing anyone wants to know. */
  tag: string;
  body: string;
  image: { src: string; alt: string };
  /** Duotone glyph for the card's icon tile. Picked per section, keyed by name. */
  icon?: IconName;
  /** CSS `object-position` for the photo crop, e.g. "50% 70%". */
  focus?: string;
};

type Cta = { label: string; href: string };

export type ServiceCardsProps = {
  id: string;
  eyebrow: string;
  headingLead: string;
  headingAccent: string;
  body: string;
  items: readonly ServiceCardItem[];
  cta: Cta;
  secondaryCta?: Cta;
  tone?: "default" | "muted";
  /**
   * `aside` — the heading and CTA hold a column beside a stacked list of
   * wide cards (Passports: pick the one situation that is yours).
   * `columns` — a split header over three side-by-side cards (Visas: compare
   * the three routes at a glance).
   */
  layout?: "aside" | "columns";
};

/**
 * The plain service block: a heading and CTA beside (or over) a set of route
 * cards. Passports and Visas used to be built from it; they now have their
 * own devices (the specimen passport, the visa deck) and share only
 * `UnbrokenLead` and `ServiceActions` from this file. It stays as the static
 * layout for a service that needs no device of its own.
 */
export function ServiceCards({
  id,
  eyebrow,
  headingLead,
  headingAccent,
  body,
  items,
  cta,
  secondaryCta,
  tone = "default",
  layout = "columns",
}: ServiceCardsProps) {
  const actions = <ServiceActions cta={cta} secondaryCta={secondaryCta} />;

  if (layout === "aside") {
    return (
      <Section id={id} spacing="md" tone={tone}>
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5 lg:self-center">
              <SectionHeading
                eyebrow={eyebrow}
                lead={<UnbrokenLead text={headingLead} />}
                accent={headingAccent}
                body={body}
                size="md"
              />
              <div className="mt-8">{actions}</div>
            </div>

            <Reveal stagger={0.12} as="ul" className="grid gap-4 lg:col-span-7">
              {items.map((item) => (
                <ServiceCard key={item.name} item={item} orientation="row" elevated />
              ))}
            </Reveal>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section id={id} spacing="md" tone={tone}>
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-14">
          <SectionHeading
            eyebrow={eyebrow}
            lead={<UnbrokenLead text={headingLead} />}
            accent={headingAccent}
            size="lg"
            className="lg:col-span-6"
          />
          <div className="lg:col-span-6 lg:pb-1">
            <p className="max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">
              {body}
            </p>
            <div className="mt-6">{actions}</div>
          </div>
        </div>

        <Reveal stagger={0.12} as="ul" className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((item) => (
            <ServiceCard key={item.name} item={item} orientation="column" />
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

/**
 * Keeps the sans lead on one line, so a wrapped heading breaks before the
 * serif accent ("No passport yet? / Start here.") rather than mid-phrase.
 */
export function UnbrokenLead({ text }: { text: string }) {
  return <span className="whitespace-nowrap">{text}</span>;
}

/** The service's primary CTA, and its secondary one beside it if it has one. */
export function ServiceActions({
  cta,
  secondaryCta,
}: {
  cta: Cta;
  secondaryCta?: Cta;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={cta.href} className={cn("cx-btn cx-btn--arrow w-full sm:w-auto")}>
        {cta.label}
        <Icon name="arrow-right" tone="current" size={18} />
      </Link>
      {secondaryCta ? (
        <Link
          href={secondaryCta.href}
          className={cn("cx-btn cx-btn--ghost w-full sm:w-auto")}
        >
          {secondaryCta.label}
        </Link>
      ) : null}
    </div>
  );
}

type ServiceCardProps = {
  item: ServiceCardItem;
  /**
   * `row` — photo left, copy right from `sm` up (stacked on phones).
   * `column` — photo on top in a three-up grid from `lg` up; a row between
   * `sm` and `lg`, where three columns would be too narrow to read.
   */
  orientation: "row" | "column";
  /** A lifted white fill, for cards on the muted section tone. */
  elevated?: boolean;
};

/**
 * One service route: an inset photograph with the turnaround on glass, then a
 * duotone icon, the name and what we do for you. Corner-lit, 20px, separated
 * from the page by fill rather than a border.
 */
export function ServiceCard({ item, orientation, elevated }: ServiceCardProps) {
  const column = orientation === "column";

  return (
    <Card
      as="li"
      elevated={elevated}
      className={cn("h-full gap-0 p-2 sm:flex-row", column && "lg:flex-col")}
    >
      <div
        className={cn(
          "tint-brand relative isolate aspect-[16/9] overflow-hidden rounded-[12px] sm:aspect-auto sm:min-h-[180px] sm:w-[38%] sm:shrink-0",
          column && "lg:aspect-[16/10] lg:min-h-0 lg:w-auto",
        )}
      >
        <ParallaxImage
          src={item.image.src}
          alt={item.image.alt}
          fill
          sizes={
            column
              ? "(max-width: 640px) 92vw, (max-width: 1024px) 40vw, 380px"
              : "(max-width: 640px) 92vw, (max-width: 1024px) 40vw, 280px"
          }
          strength={8}
          style={item.focus ? { objectPosition: item.focus } : undefined}
          className="absolute inset-0 -z-10"
        />
        <Chip glass className="absolute top-3 left-3 z-[2]">
          <Icon name="clock" tone="current" size={14} />
          {item.tag}
        </Chip>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col px-3 pt-5 pb-4 sm:justify-center sm:px-6 sm:py-6",
          column && "lg:justify-start lg:px-4 lg:pt-6 lg:pb-5",
        )}
      >
        <div className="flex items-center gap-3.5">
          {item.icon ? <IconTile name={item.icon} variant="glass" size="sm" /> : null}
          <h3 className="text-[20px] leading-tight font-semibold tracking-[-0.02em] text-foreground sm:text-[22px]">
            {item.name}
          </h3>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {item.body}
        </p>
      </div>
    </Card>
  );
}
