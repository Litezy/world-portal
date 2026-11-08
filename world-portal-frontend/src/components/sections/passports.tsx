import { PassportsMotion } from "@/components/sections/passports-motion";
import { PassportSpecimen } from "@/components/sections/passports-specimen";
import { ServiceActions, UnbrokenLead } from "@/components/sections/service-cards";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { passports } from "@/content/landing";
import { Chip } from "@/ds/components/chip";
import { Icon, type IconName, IconTile } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

type PassportRoute = (typeof passports.items)[number]["name"];

/** Presentation only: each situation's icon. */
const ICON = {
  "First passport": "id-card",
  Renewal: "refresh",
  "Lost or damaged": "search-x",
} satisfies Record<PassportRoute, IconName>;

/**
 * Service — live. Nothing else can start until the passport exists.
 *
 * A sticky split: from lg up a specimen passport holds still on the left
 * while the three situations scroll past on the right, and it fills in as
 * they go (photo and details, renewed dates and a glint of the chip, a new
 * number and the issued stamp). Below lg the passport sits between the
 * heading and the situations and plays the same stages as it passes up the
 * screen. `PassportsMotion` drives it; the markup is the finished state.
 */
export function Passports() {
  return (
    <Section id="passports" spacing="md" tone="muted">
      <Container>
        <PassportsMotion className="grid gap-10 sm:gap-12 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-0">
          <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
            <SectionHeading
              eyebrow={passports.eyebrow}
              lead={<UnbrokenLead text={passports.headingLead} />}
              accent={passports.headingAccent}
              body={passports.body}
              size="md"
            />
            <div className="mt-8">
              <ServiceActions cta={passports.cta} />
            </div>
          </div>

          {/* The passport. Sticky beside the situations, centred in the
              viewport under the fixed header. */}
          <div className="lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="mx-auto w-[min(100%,21rem)] py-4 sm:w-[min(100%,24rem)] lg:sticky lg:top-[max(7rem,calc(50svh-17rem))] lg:w-[min(100%,25rem)] lg:py-0">
              <PassportSpecimen />
            </div>
          </div>

          <ol className="grid gap-4 lg:col-span-7 lg:col-start-6 lg:row-start-2 lg:mt-[16vh] lg:gap-[24vh] lg:pb-[20vh]">
            {passports.items.map((item, i) => (
              <li
                key={item.name}
                data-pp-step
                data-active="true"
                className="group/step relative isolate rounded-card p-6 sm:p-7"
              >
                {/* The active card's lift: a fill and a blue rule that fade in,
                    so the text never changes colour. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 -z-10 rounded-card bg-card shadow-[0_18px_44px_-26px_rgb(8_20_50/0.35)] ring-1 ring-hairline",
                    "opacity-0 transition-opacity duration-500 ease-cx group-data-[active=true]/step:opacity-100",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-6 bottom-6 left-0 w-[3px] origin-top scale-y-0 rounded-full bg-ember",
                    "transition-[scale] duration-500 ease-(--cx-spring) group-data-[active=true]/step:scale-y-100",
                  )}
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[12px] font-semibold tracking-[0.14em] text-text-3 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Chip>
                    <Icon name="clock" tone="current" size={14} />
                    {item.tag}
                  </Chip>
                </div>
                <div className="mt-4 flex items-center gap-3.5">
                  <IconTile name={ICON[item.name]} variant="glass" size="sm" />
                  <h3 className="text-[20px] leading-tight font-semibold tracking-[-0.02em] text-foreground sm:text-[22px]">
                    {item.name}
                  </h3>
                </div>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </PassportsMotion>
      </Container>
    </Section>
  );
}
