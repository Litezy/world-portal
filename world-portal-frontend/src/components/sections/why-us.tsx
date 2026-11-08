import Link from "next/link";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";
import { WhyUsMotion } from "@/components/sections/why-us-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { whyUs } from "@/content/landing";
import { Card } from "@/ds/components/card";
import { Icon, type IconName, IconTile } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

type WhyUsCard = (typeof whyUs.cards)[number];

/** Binds the lead's last word to the one before it, so the line never opens on a lone "us". */
const glueLastWord = (text: string) => text.replace(/ (\S+)$/, " $1");

/** The kit's duotone glyph for each card, keyed by the card's existing icon id. */
const GLYPH: Record<WhyUsCard["icon"], IconName> = {
  passport: "badge-check",
  bolt: "bolt",
  concierge: "headset",
  compass: "compass",
};

/** Routes navigate client-side; in-page anchors stay plain links. */
function CardLink({ card }: { card: WhyUsCard }) {
  const className = cn(
    "inline-flex items-center gap-1 text-[14px] font-semibold text-foreground outline-none",
    // Stretched over the whole card, so the card is one big target and the
    // focus ring traces the card rather than the words.
    "after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset",
  );
  return card.href.startsWith("/") ? (
    <Link href={card.href} className={className}>
      {card.cta}
    </Link>
  ) : (
    <a href={card.href} className={className}>
      {card.cta}
    </a>
  );
}

/** One span per word, so the words can ink in one at a time. */
function Words({ text }: { text: string }) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.map((word, i) => (
    <span key={i}>
      <span data-why-word>{word}</span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}

/**
 * The answer to the heading, set big. `bodyMark` is lifted out of the
 * sentence and underlined with a gold marker stroke — the section's one gold
 * touch. If the mark ever stops matching the copy, the sentence simply
 * renders without it.
 */
function Statement() {
  const at = whyUs.body.indexOf(whyUs.bodyMark);
  if (at < 0) return <Words text={whyUs.body} />;
  const before = whyUs.body.slice(0, at);
  const after = whyUs.body.slice(at + whyUs.bodyMark.length);

  return (
    <>
      <Words text={before} />{" "}
      <span data-why-marked className="relative whitespace-nowrap">
        <span
          data-why-mark
          aria-hidden="true"
          className="absolute inset-x-[-0.06em] bottom-[0.08em] -z-10 h-[0.36em] origin-left rounded-[0.1em] bg-gold/50 dark:bg-gold/35"
        />
        <Words text={whyUs.bodyMark} />
      </span>
      {/^[\s]/.test(after) ? " " : null}
      <Words text={after} />
    </>
  );
}

/**
 * Kinetic type in the inset tray. The photograph asks the question (the
 * two-tone heading on the left); the answer is a statement set big beside it,
 * whose words ink in as you scroll through; then the four reasons settle into
 * a row under both. Motion lives in `WhyUsMotion`.
 */
export function WhyUs() {
  return (
    <section id="why-us" className="pb-4">
      <Container size="panel" gutter="sm">
        <WhyUsMotion className="grid gap-3 rounded-[2rem] bg-ink-100 p-3 sm:gap-4 sm:p-4 lg:grid-cols-12 lg:rounded-[2.25rem] dark:bg-ink-50">
          {/* Photo cell: the only place the photograph appears, so it never
              sits behind body copy. */}
          <div className="cx-lit relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden rounded-card p-6 [--cx-lit:#fff] sm:min-h-[420px] sm:p-8 lg:col-span-5 lg:min-h-[500px] lg:p-10">
            <ParallaxImage
              src={whyUs.background.src}
              alt={whyUs.background.alt}
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              strength={12}
              className="absolute inset-0 -z-20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(8_10_14/0.12)_0%,rgb(8_10_14/0.06)_32%,rgb(8_10_14/0.55)_62%,rgb(8_10_14/0.86)_100%)]"
            />
            <span className="cx-lit-2" aria-hidden="true" />

            <Reveal stagger={0.1} className="flex flex-col items-start">
              <span className="glass-frost-dark mb-5 inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-[13px] font-medium text-white">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-white" />
                {whyUs.eyebrow}
              </span>
              <SectionHeading
                lead={glueLastWord(whyUs.headingLead)}
                accent={whyUs.headingAccent}
                onDark
                size="md"
                className="max-w-lg"
              />
            </Reveal>
          </div>

          {/* The answer. */}
          <Card
            lit
            className="flex flex-col justify-center gap-0 bg-white p-7 sm:p-10 lg:col-span-7 lg:px-14 lg:py-12 dark:bg-ink-100"
          >
            <p
              data-why-statement
              className="relative isolate text-[30px] leading-[1.12] font-semibold tracking-[-0.035em] text-balance text-foreground sm:text-[42px] lg:text-[48px] xl:text-[56px]"
            >
              <Statement />
            </p>
          </Card>

          <ul
            data-why-reasons
            className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-12 lg:grid-cols-4"
          >
            {whyUs.cards.map((card) => (
              <li key={card.title} data-why-reason className="flex">
                <Card
                  interactive
                  className="group/card flex-1 gap-0 bg-white p-6 sm:p-7 dark:bg-ink-100"
                >
                  <IconTile name={GLYPH[card.icon]} variant="glass" />

                  <h3 className="mt-5 text-[18px] leading-snug font-semibold tracking-[-0.02em] text-foreground sm:mt-7 sm:text-[19px]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-pretty text-muted-foreground">
                    {card.body}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-5 sm:pt-7">
                    <CardLink card={card} />
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-foreground transition-[background-color,color,transform] duration-300 ease-cx group-hover/card:bg-ember group-hover/card:text-on-primary motion-safe:group-hover/card:translate-x-0.5"
                    >
                      <Icon name="arrow-up-right" tone="current" size={16} />
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </WhyUsMotion>
      </Container>
    </section>
  );
}
