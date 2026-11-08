import { Reveal } from "@/components/motion/reveal";
import { ComingSoonLink, ComingSoonNotice } from "@/components/sections/coming-soon";
import { FlightsHotelsStage } from "@/components/sections/flights-hotels-stage";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { flightsHotels } from "@/content/landing";
import { Card } from "@/ds/components/card";
import { type IconName, IconTile } from "@/ds/components/icon";

type StatLabel = (typeof flightsHotels.stats)[number]["label"];

/** One duotone glyph per promise, keyed by the stat's own label. */
const STAT_ICON: Record<StatLabel, IconName> = {
  "Typical time to get your prices": "timer",
  "Someone to call if a flight changes": "headset",
  "Extra fees added at the end": "receipt",
};

/**
 * Service 2 — sold on speed. The page's seventh beat: a scroll-linked tear in
 * normal flow. A boarding pass rips away as the visitor scrolls and the room
 * key for the same trip is underneath (`FlightsHotelsStage`) — the seat and
 * the room, sorted together, which is the whole pitch.
 *
 * Underneath, the three promises are design-system stat cards: a glyph, a
 * strong Manrope numeral and the caption, so a service that is not open yet
 * still reads as finished and specific.
 */
export function FlightsHotels() {
  return (
    <Section id="flights-hotels" spacing="md" className="overflow-hidden">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow={flightsHotels.eyebrow}
            lead={flightsHotels.headingLead}
            accent={flightsHotels.headingAccent}
            body={flightsHotels.body}
            size="md"
            className="max-w-xl"
          >
            <ComingSoonNotice soon notice={flightsHotels.notice} />
          </SectionHeading>
          <ComingSoonLink
            href={flightsHotels.cta.href}
            label={flightsHotels.cta.label}
            className="self-start lg:self-end"
          />
        </div>

        <div className="mt-10 sm:mt-14">
          <FlightsHotelsStage />
        </div>

        <Reveal
          stagger={0.1}
          className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5"
        >
          {flightsHotels.stats.map((stat) => (
            <Card
              key={stat.label}
              className="flex-row items-start justify-between gap-4 p-6 sm:p-7"
            >
              {/* Label first in the DOM so it reads "caption: value"; the
                  value is shown first. */}
              <dl className="flex flex-col-reverse">
                <dt className="mt-3 text-[14px] leading-snug text-muted-foreground">
                  {stat.label}
                </dt>
                <dd>
                  <StatValue value={stat.value} />
                </dd>
              </dl>
              <IconTile
                name={STAT_ICON[stat.label] ?? "sparkle"}
                variant="glass"
                size="sm"
              />
            </Card>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

/** "4 hrs" sets the number large and the unit beside it; "24/7" and "0" stay whole. */
function StatValue({ value }: { value: string }) {
  const [, figure, unit] = /^(\S+)\s+(.+)$/.exec(value) ?? [null, value, null];

  return (
    <span className="flex items-baseline gap-1.5 text-[44px] leading-none font-semibold tracking-[-0.045em] text-foreground tabular-nums sm:text-[52px]">
      {figure}
      {unit ? (
        <span className="text-[20px] font-medium tracking-[-0.01em] text-text-3">
          {unit}
        </span>
      ) : null}
    </span>
  );
}
