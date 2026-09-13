import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { agencySection } from "@/content/agency";
import { allCategories, categoryCatalog } from "@/features/agency/catalog";

/**
 * The one band on the landing page that is not addressed to a traveller.
 *
 * Everything above it sells a trip; this sells a shopfront to the business
 * that will staff it — the security firm, the caterer, the driver. It is the
 * same site (same eyebrow, same two-tone heading, same pill buttons) turned to
 * face a different reader, so the only thing that changes is the argument: get
 * found, assign your own people, get paid.
 *
 * The service grid is rendered straight from `categoryCatalog` rather than
 * from a list written here, so the day a category is added to the catalog it
 * appears in the pitch without anyone remembering to update this file.
 */
export function Agency() {
  return (
    // tone="default": WorldSpace above is `muted` grey and Contact below is a
    // dark photograph. `muted` here would dissolve the seam with WorldSpace
    // into one long grey; `ink` would stack a dark band directly on Contact's
    // dark band and lose the page's one dark moment. White separates it
    // cleanly from both, and reads as the change of address it is.
    <Section id="agency" spacing="md" tone="default" data-agency-section="">
      {/* size="content": a heading beside a card grid — no inset panel, so
          `panel` (reserved for Why Us and Journey) does not apply. */}
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          {/* stagger 0 — the argument moves as one block, so the heading and
              the points it supports never arrive apart. */}
          <Reveal>
            <SectionHeading
              eyebrow={agencySection.eyebrow}
              lead={agencySection.headingLead}
              accent={agencySection.headingAccent}
              body={agencySection.body}
              size="md"
            />

            <ul className="mt-9 grid gap-6">
              {agencySection.points.map((point, index) => (
                <li key={point.title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary ring-1 ring-primary/15 ring-inset"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                      {point.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-pretty text-muted-foreground">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {/* asChild forwards a single child, so the icon goes inside the
                  link rather than through rightIcon. */}
              <Button asChild variant="primary" size="lg">
                <Link href={agencySection.cta.href}>
                  {agencySection.cta.label}
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={agencySection.secondaryCta.href}>
                  {agencySection.secondaryCta.label}
                </Link>
              </Button>
            </div>

            <p className="mt-5 text-[13px] text-muted-foreground">
              {agencySection.note}
            </p>
          </Reveal>

          {/* The grey tray is what marks this column as the other side of the
              product without spending a `tone` on the whole section. */}
          <div className="rounded-[2rem] bg-ink-100 p-4 sm:p-6">
            <Reveal
              as="ul"
              stagger={0.05}
              y={18}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            >
              {allCategories.map((category) => {
                const entry = categoryCatalog[category];
                const Icon = entry.icon;

                return (
                  <li key={category} className="h-full">
                    <Card
                      variant="solid"
                      radius="lg"
                      padding="none"
                      className="h-full p-5"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 ring-inset">
                        <Icon className="size-[18px]" />
                      </span>
                      {/* A plain <p>, not a heading: ten more h3s under one
                          h2 turns the section into a wall of headings for a
                          screen reader, and these are labels on a list. */}
                      <p className="mt-4 text-[14px] font-semibold tracking-tight text-foreground">
                        {entry.label}
                      </p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-pretty text-muted-foreground">
                        {entry.blurb}
                      </p>
                    </Card>
                  </li>
                );
              })}
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
