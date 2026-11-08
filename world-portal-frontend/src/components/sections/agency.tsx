import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { AgencyFigures } from "@/components/sections/agency-figures";
import { AgencySpotlight } from "@/components/sections/agency-spotlight";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { agencySection } from "@/content/agency";
import { Icon, type IconName, IconTile } from "@/ds/components/icon";
import {
  allCategories,
  baseDocuments,
  categoryCatalog,
} from "@/features/agency/catalog";
import type { AgencyCategory } from "@/features/agency/types";
import { cn } from "@/lib/utils";

/**
 * The design system's duotone glyph for each category. The catalog keeps its
 * lucide icon for the agency console; this is only how the landing pitch draws
 * it. Typed as a full Record, so a category added to the catalog without a
 * glyph here fails the typecheck instead of rendering a blank tile.
 */
const categoryGlyph: Record<AgencyCategory, IconName> = {
  security: "shield-check",
  catering: "flame",
  driving: "car",
  cleaning: "sparkle",
  tour_guide: "compass",
  interpreting: "languages",
  childcare: "baby",
  logistics: "truck",
  events: "party-popper",
  medical: "heart-pulse",
};

/** One glyph per step of the pitch, in order: get listed, staff it, get paid. */
const stepGlyphs: readonly IconName[] = ["store", "users", "hand-coins"];

/**
 * The three numbers under the pitch, each derived from the product rather
 * than typed: the catalog's categories, the free listing, and the documents
 * every agency files whatever it sells. The free listing is the band's one
 * gold touch.
 */
const figures = [
  { value: allCategories.length, label: agencySection.figures.categories },
  { value: 0, label: agencySection.figures.fee, gold: true },
  { value: baseDocuments.length, label: agencySection.figures.documents },
];

/**
 * The one band on the landing page that is not addressed to a traveller.
 *
 * Everything above it sells a trip; this sells a shopfront to the business
 * that will staff it — the security firm, the caterer, the driver. So it is
 * the same system turned to face a different reader: an inset island with its
 * own corner light and a single static brand glow, holding three bands — the
 * pitch, the three steps of a job as one rail, and the shelf of services an
 * agency can list.
 *
 * The island follows the page theme: pale sky blue in light (the default),
 * the elevated surface in dark. It re-declares `data-brand="e-embassy"` so
 * the kit's defaults never bring WorldStreet's ember back inside it.
 *
 * The service shelf is rendered straight from `categoryCatalog` rather than
 * from a list written here, so the day a category is added to the catalog it
 * appears in the pitch without anyone remembering to update this file.
 *
 * The page's tenth beat is a light you carry: `AgencySpotlight` makes the
 * island follow the pointer with a soft brand light (and lets the calls to
 * action lean toward it), or drift the light down the band on touch, while
 * `AgencyFigures` rolls the key numbers into place.
 */
export function Agency() {
  return (
    // tone="default": WorldSpace above is `muted` grey and Contact below is a
    // photograph. The page-coloured margin around the island keeps it from
    // merging with Contact's band.
    <Section id="agency" spacing="md" tone="default" data-agency-section="">
      {/* size="panel": an inset rounded panel, like Why Us and Journey. */}
      <Container size="panel" gutter="sm">
        <AgencySpotlight
          data-brand="e-embassy"
          className={cn(
            "cx-card cx-lit block gap-0 rounded-[28px] p-0 text-foreground sm:rounded-[32px]",
            // Pale sky on a light page; one step up on a dark page, where the
            // page colour would swallow the island.
            "bg-brand-50 dark:bg-elevated",
          )}
        >
          <span className="cx-lit-2" aria-hidden="true" />
          {/* The section's one effect: a static brand glow behind the pitch,
              so the light in the island has a direction. Nothing loops. */}
          <span
            aria-hidden="true"
            className="cx-orb pointer-events-none -top-32 -right-24 size-[420px] opacity-60"
          />
          {/* Dithers the glow so it never bands into stripes. */}
          <span aria-hidden="true" className="grain absolute inset-0 -z-[1]" />

          <div className="relative mx-auto max-w-[1200px] px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            {/* stagger 0 — the argument moves as one block, so the heading and
                the doors it opens never arrive apart. */}
            <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
              <SectionHeading
                eyebrow={agencySection.eyebrow}
                lead={agencySection.headingLead}
                accent={agencySection.headingAccent}
                size="lg"
                className="lg:col-span-7"
              />

              <div className="lg:col-span-5 lg:pb-1">
                <p className="max-w-md text-[15.5px] leading-relaxed text-pretty text-muted-foreground">
                  {agencySection.body}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {/* next/link with the kit's pill classes: these are our own
                      routes, so they keep client-side navigation. The
                      magnetic pull moves the wrapper, never the button, so
                      the kit's own press and hover transforms still work. */}
                  <span data-magnetic="" className="inline-flex w-full sm:w-auto">
                    <Link
                      href={agencySection.cta.href}
                      className="cx-btn cx-btn--arrow h-12 w-full px-6 text-[16px] font-medium sm:w-auto"
                    >
                      {agencySection.cta.label}
                      <Icon name="arrow-right" tone="current" size={18} />
                    </Link>
                  </span>
                  <span data-magnetic="" className="inline-flex w-full sm:w-auto">
                    <Link
                      href={agencySection.secondaryCta.href}
                      className="cx-btn cx-btn--ghost h-12 w-full px-6 text-[16px] sm:w-auto"
                    >
                      {agencySection.secondaryCta.label}
                    </Link>
                  </span>
                </div>

                <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Icon
                    name="check-circle"
                    tone="current"
                    size={16}
                    className="shrink-0"
                  />
                  {agencySection.note}
                </p>
              </div>
            </Reveal>

            <AgencyFigures
              figures={figures}
              className="mt-12 border-y border-hairline py-8 sm:mt-14 sm:py-10 lg:mt-16"
            />

            {/* The three steps of one job as a single rail: each step's tile
                sits on the track, and the track runs on to the next step, so
                the list reads as a sequence rather than three loose points. */}
            <Reveal
              as="ol"
              stagger={0.08}
              y={18}
              className="mt-14 grid gap-8 sm:mt-16 md:grid-cols-3 md:gap-6 lg:mt-20"
            >
              {agencySection.points.map((point, index) => (
                <li
                  key={point.title}
                  className="relative grid grid-cols-[auto_1fr] gap-x-4 md:block"
                >
                  <div className="flex items-center gap-4 self-start">
                    <IconTile name={stepGlyphs[index] ?? "check"} size="sm" />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "hidden h-px flex-1 md:block",
                        index < agencySection.points.length - 1
                          ? "bg-gradient-to-r from-foreground/25 to-foreground/8"
                          : "bg-gradient-to-r from-foreground/18 to-transparent",
                      )}
                    />
                  </div>
                  {/* Below md the rail turns vertical and runs down from the
                      tile to the next step. */}
                  {index < agencySection.points.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-12 -bottom-6 left-5 w-px bg-gradient-to-b from-foreground/20 to-foreground/5 md:hidden"
                    />
                  ) : null}

                  <div className="md:mt-6">
                    <p
                      aria-hidden="true"
                      className="text-[12px] font-semibold tracking-[0.16em] text-foreground/55 tabular-nums"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1.5 text-[18px] leading-snug font-semibold tracking-tight text-foreground">
                      {point.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-[14.5px] leading-relaxed text-pretty text-muted-foreground">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </Reveal>

            <div aria-hidden="true" className="mt-14 h-px bg-hairline sm:mt-16" />

            {/* The shelf of services. Corner-lit tiles separated by fill, not
                outlines, five across at desktop. */}
            <Reveal
              as="ul"
              stagger={0.04}
              y={16}
              className="mt-10 grid grid-cols-2 gap-2.5 sm:mt-12 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5"
            >
              {allCategories.map((category) => {
                const entry = categoryCatalog[category];

                return (
                  <li
                    key={category}
                    className="cx-card cx-lit gap-0 p-4 shadow-none sm:p-5"
                  >
                    <span className="cx-lit-2" aria-hidden="true" />
                    <IconTile
                      name={categoryGlyph[category]}
                      variant="glass"
                      size="sm"
                    />
                    {/* A plain <p>, not a heading: ten more h3s under one h2
                        turns the section into a wall of headings for a
                        screen reader, and these are labels on a list. */}
                    <p className="mt-4 text-[14.5px] leading-snug font-semibold tracking-tight text-foreground">
                      {entry.label}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-pretty text-muted-foreground">
                      {entry.blurb}
                    </p>
                  </li>
                );
              })}
            </Reveal>
          </div>
        </AgencySpotlight>
      </Container>
    </Section>
  );
}
