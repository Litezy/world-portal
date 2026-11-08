import { ServiceActions, UnbrokenLead } from "@/components/sections/service-cards";
import {
  type VisaDeckCard,
  type VisaDestination,
  VisasPicker,
} from "@/components/sections/visas-picker";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { visas } from "@/content/landing";
import { resolveVisaRoute } from "@/features/visa/requirement";

type VisaName = (typeof visas.items)[number]["name"];

/** Presentation only: each kind's route id, icon and where its photo is cropped. */
const ART = {
  eVisa: { route: "evisa", icon: "smartphone", focus: "50% 45%" },
  "T.Visa (Traditional Visa)": { route: "tvisa", icon: "building", focus: "50% 62%" },
  ETA: { route: "eta", icon: "bolt", focus: "72% 70%" },
} satisfies Record<VisaName, Pick<VisaDeckCard, "route" | "icon" | "focus">>;

/**
 * Service — live, and the flagship. A split header, then a destination
 * picker over a deck of the three kinds of visa (`VisasPicker`).
 *
 * Each destination is resolved here, on the server, by the same ruleset the
 * application's first screen uses, so the picker repeats the product's own
 * answer and the country list never ships to the browser.
 */
export function Visas() {
  const { picker } = visas;

  const destinations: VisaDestination[] = picker.destinations.map((d) => {
    const verdict = resolveVisaRoute(picker.passport, d.code);
    return {
      code: d.code,
      city: d.city,
      country: verdict.destination?.name ?? d.city,
      route: verdict.route,
      label: verdict.label,
      turnaround: verdict.turnaround,
      summary: verdict.summary,
      next: verdict.next,
    };
  });

  const cards: VisaDeckCard[] = visas.items.map((item) => ({
    ...item,
    ...ART[item.name],
  }));

  return (
    <Section id="visas" spacing="md" className="overflow-x-clip">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-14">
          <SectionHeading
            eyebrow={visas.eyebrow}
            lead={<UnbrokenLead text={visas.headingLead} />}
            accent={visas.headingAccent}
            size="lg"
            className="lg:col-span-6"
          />
          <div className="lg:col-span-6 lg:pb-1">
            <p className="max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">
              {visas.body}
            </p>
            <div className="mt-6">
              <ServiceActions cta={visas.cta} secondaryCta={visas.secondaryCta} />
            </div>
          </div>
        </div>

        <VisasPicker
          cards={cards}
          destinations={destinations}
          copy={{
            prompt: picker.prompt,
            passportNote: picker.passportNote,
            resultLabel: picker.resultLabel,
            note: picker.note,
            browsing: picker.browsing,
            visaFree: picker.visaFree,
            deckLabel: picker.deckLabel,
            showCard: picker.showCard,
            previous: picker.previous,
            next: picker.next,
          }}
        />
      </Container>
    </Section>
  );
}
