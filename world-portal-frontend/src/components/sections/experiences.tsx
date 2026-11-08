import Image from "next/image";

import { ComingSoonLink, ComingSoonNotice } from "@/components/sections/coming-soon";
import {
  ExperiencesMarker,
  ExperiencesStack,
} from "@/components/sections/experiences-stack";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { experiences } from "@/content/landing";
import { Icon, type IconName } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

type Highlight = (typeof experiences.highlights)[number];

/** One duotone glyph per highlight, keyed by the highlight itself. */
const HIGHLIGHT_ICON: Record<Highlight, IconName> = {
  "Private guides and drivers": "user-star",
  "Tickets booked ahead, no queues": "ticket",
  "Small groups, not coach parties": "users",
  "Or built entirely around you": "compass",
};

/**
 * Each card's text panel has its own tone, so a card sliding over the last
 * reads as a new thing arriving rather than the same slab again: ink, the
 * brand blue, the page's own paper, and a deep night blue.
 */
const PANEL_TONES = [
  { panel: "bg-ink-950 text-white", body: "text-white/75", dark: true },
  { panel: "bg-brand-600 text-white", body: "text-white/80", dark: true },
  { panel: "bg-elevated text-foreground", body: "text-muted-foreground", dark: false },
  { panel: "bg-brand-950 text-white", body: "text-white/75", dark: true },
] as const;

/** "planned properly." → ["planned", "properly."], so the last word gets the marker. */
function splitLastWord(text: string) {
  const at = text.lastIndexOf(" ");
  return at === -1 ? ["", text] : [text.slice(0, at), text.slice(at + 1)];
}

/**
 * Service 3 — sold on curation. The page's eighth beat: sticky stacking cards.
 *
 * One card per promise, each a photograph beside a panel in its own tone.
 * They are sticky, so as the visitor scrolls each card slides up over the one
 * before it, which eases back and dims (`ExperiencesStack` owns that motion).
 * Normal flow, no pin.
 *
 * Under reduced motion the deck is laid out flat: a two-up grid of the same
 * cards from sm, one column on a phone. The cards size themselves with
 * container queries, so a card is wide (panel beside photo) on the stage and
 * tall (photo over panel) in half the width or on a phone.
 */
export function Experiences() {
  const [accentLead, accentLast] = splitLastWord(experiences.headingAccent);
  const total = String(experiences.stack.length).padStart(2, "0");

  return (
    <Section id="experiences" spacing="md">
      <Container>
        <SectionHeading
          eyebrow={experiences.eyebrow}
          lead={experiences.headingLead}
          accent={
            <>
              {accentLead ? `${accentLead} ` : null}
              <ExperiencesMarker>{accentLast}</ExperiencesMarker>
            </>
          }
          body={experiences.body}
          align="center"
          size="md"
        >
          <ComingSoonNotice
            soon
            notice={experiences.notice}
            className="justify-center"
          />
        </SectionHeading>

        <ExperiencesStack
          className={cn(
            "mt-10 sm:mt-14",
            "[--stack-step:12px] [--stack-top:5.25rem] lg:[--stack-step:16px] lg:[--stack-top:6.75rem]",
            "motion-reduce:grid motion-reduce:gap-4 motion-reduce:sm:grid-cols-2 motion-reduce:sm:gap-5",
          )}
        >
          {experiences.stack.map((card, index) => {
            const tone = PANEL_TONES[index % PANEL_TONES.length]!;
            const inset = "inset" in card ? card.inset : null;

            return (
              <li
                key={card.title}
                style={{ "--i": index } as React.CSSProperties}
                className={cn(
                  "motion-safe:sticky motion-safe:top-[calc(var(--stack-top)+var(--i)*var(--stack-step))]",
                  "motion-safe:mb-[6vh] motion-safe:last:mb-0 motion-safe:last:pb-[12vh]",
                )}
              >
                <article
                  data-stack-card=""
                  className={cn(
                    "@container relative isolate overflow-hidden rounded-[24px] will-change-transform sm:rounded-[28px]",
                    "ring-1 ring-ink-950/[0.06] dark:ring-white/10",
                    "shadow-[0_-18px_50px_-28px_rgb(8_20_50/0.55)]",
                    "motion-safe:h-[min(74svh,560px)]",
                  )}
                >
                  <div className="grid h-full grid-rows-[minmax(13rem,1fr)_auto] @2xl:grid-cols-[5fr_7fr] @2xl:grid-rows-1">
                    {/* The photograph: on top in a narrow card, on the right
                        in a wide one. */}
                    <div className="relative min-h-[13rem] overflow-hidden bg-ink-950 motion-reduce:aspect-[4/3] @2xl:order-2 @2xl:motion-reduce:aspect-auto">
                      <div data-stack-image="" className="absolute inset-0">
                        <Image
                          src={card.image.src}
                          alt={card.image.alt}
                          fill
                          sizes="(max-width: 768px) 92vw, 700px"
                          className="object-cover"
                        />
                      </div>
                      {inset ? (
                        <div className="absolute right-5 bottom-5 hidden aspect-[4/5] w-[28%] max-w-[190px] rotate-[4deg] overflow-hidden rounded-[14px] shadow-[0_24px_48px_-16px_rgb(2_8_23/0.7)] ring-4 ring-white @2xl:block">
                          <Image
                            src={inset.src}
                            alt={inset.alt}
                            fill
                            sizes="190px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "flex flex-col justify-between gap-8 p-6 sm:p-8 @2xl:order-1 @4xl:p-10",
                        tone.panel,
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span
                          aria-hidden="true"
                          className="text-[13px] font-semibold tracking-[0.14em] tabular-nums opacity-70"
                        >
                          {String(index + 1).padStart(2, "0")} / {total}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-11 place-items-center rounded-[14px]",
                            tone.dark ? "bg-white/12" : "cx-itile cx-itile--brand",
                          )}
                        >
                          <Icon
                            name={HIGHLIGHT_ICON[card.title] ?? "compass"}
                            tone="white"
                            size={22}
                          />
                        </span>
                      </div>

                      <div>
                        <h3 className="text-[26px] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-[32px] @4xl:text-[40px]">
                          {card.title}
                        </h3>
                        <p
                          className={cn(
                            "mt-3 max-w-sm text-[15px] leading-relaxed text-pretty sm:mt-4 sm:text-base",
                            tone.body,
                          )}
                        >
                          {card.body}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dims the card once the next one has slid over it. */}
                  <div
                    data-stack-shade=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 bg-ink-950 opacity-0"
                  />
                </article>
              </li>
            );
          })}
        </ExperiencesStack>

        <div className="mt-10 flex justify-center sm:mt-12">
          <ComingSoonLink href={experiences.cta.href} label={experiences.cta.label} />
        </div>
      </Container>
    </Section>
  );
}
