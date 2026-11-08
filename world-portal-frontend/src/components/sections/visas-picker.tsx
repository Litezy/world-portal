"use client";

import * as React from "react";
import Image from "next/image";

import { Card } from "@/ds/components/card";
import { Chip } from "@/ds/components/chip";
import { Icon, type IconName, IconTile } from "@/ds/components/icon";
import { TiltCard } from "@/ds/components/motion";
import type { VisaRoute } from "@/features/visa/requirement";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/** One kind of visa, as a card in the deck. */
export type VisaDeckCard = {
  route: Exclude<VisaRoute, "visa-free">;
  name: string;
  tag: string;
  body: string;
  image: { src: string; alt: string };
  icon: IconName;
  focus: string;
};

/** A destination, already resolved on the server by the visa ruleset. */
export type VisaDestination = {
  code: string;
  city: string;
  country: string;
  route: VisaRoute;
  label: string;
  turnaround: string;
  summary: string;
  next: readonly string[];
};

export type VisasPickerCopy = {
  prompt: string;
  passportNote: string;
  resultLabel: string;
  note: string;
  browsing: string;
  visaFree: string;
  deckLabel: string;
  showCard: string;
  previous: string;
  next: string;
};

/** Where a card sits relative to the front one: 0 front, 1 right, -1 left. */
function slotOf(index: number, front: number, count: number) {
  const pos = (index - front + count) % count;
  return pos === 0 ? 0 : pos === 1 ? 1 : -1;
}

/**
 * The deck's fan. `--fan` is the sideways offset (narrower on phones),
 * `--spread` opens the fan with the scroll (1 when nothing animates it).
 */
function fanTransform(slot: number, dimmed: boolean) {
  const side = `calc(var(--fan) * ${slot} * var(--spread, 1))`;
  if (slot === 0) {
    return dimmed
      ? `translate(0, 5%) scale(0.9)`
      : `translate(0, 0) rotate(0deg) scale(1)`;
  }
  const lift = dimmed ? "2%" : "-4%";
  const scale = dimmed ? 0.84 : 0.9;
  return `translate(${side}, ${lift}) rotate(calc(${slot * 6}deg * var(--spread, 1))) scale(${scale})`;
}

/**
 * Visas, the interactive part: pick a destination and the deck deals the
 * visa it needs to the front, with what happens next beside it.
 *
 * - The pills choose a destination. Its verdict (which visa, how long, the
 *   summary and the next steps) comes from the app's own ruleset, resolved
 *   on the server — this component states nothing of its own.
 * - The deck is the three kinds of visa. The front card tilts toward the
 *   pointer; a card behind it can be clicked (or swiped to, or reached with
 *   the arrows) to read it, which leaves the destination unpicked.
 * - A visa-free destination pushes the whole deck back and lays a "No visa
 *   needed" slip over it.
 *
 * The first destination is picked on the server, so the section renders
 * complete without JavaScript and with reduced motion (where the only
 * scroll effect, the fan opening, is skipped).
 */
export function VisasPicker({
  cards,
  destinations,
  copy,
}: {
  cards: readonly VisaDeckCard[];
  destinations: readonly VisaDestination[];
  copy: VisasPickerCopy;
}) {
  const first = destinations[0];
  const [dest, setDest] = React.useState<string | null>(first?.code ?? null);
  const [front, setFront] = React.useState(() => {
    const at = cards.findIndex((c) => c.route === first?.route);
    return at < 0 ? 0 : at;
  });
  const chosen = destinations.find((d) => d.code === dest) ?? null;
  const free = chosen?.route === "visa-free";
  const count = cards.length;

  const choose = (d: VisaDestination) => {
    setDest(d.code);
    const at = cards.findIndex((c) => c.route === d.route);
    if (at >= 0) setFront(at);
  };
  const bring = (index: number) => {
    setDest(null);
    setFront(((index % count) + count) % count);
  };

  // A horizontal swipe on the deck deals the next (or previous) card. A
  // swipe that ends on a card behind must not also count as clicking it.
  const swipe = React.useRef<{ x: number; y: number } | null>(null);
  const swiped = React.useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped.current = true;
      bring(front + (dx < 0 ? 1 : -1));
    }
  };

  // The fan opens as the deck comes up the screen, and closes on the way back.
  const deckRef = useGsap(({ scope }) => {
    if (!scope) return;
    gsap.fromTo(
      scope,
      { "--spread": 0 },
      {
        "--spread": 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: scope,
          start: "top 92%",
          end: "top 45%",
          scrub: 0.6,
        },
      },
    );
  }, []);

  return (
    <div
      className={cn(
        "mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-6",
        "[grid-template-areas:'picker'_'deck'_'result']",
        "lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'picker_deck'_'result_deck']",
      )}
    >
      {/* The destinations. */}
      <div className="[grid-area:picker] lg:col-span-5">
        <p className="text-[18px] font-semibold tracking-[-0.02em] text-foreground">
          {copy.prompt}
        </p>
        <p className="mt-1 text-[14px] text-muted-foreground">{copy.passportNote}</p>
        <div
          role="group"
          aria-label={copy.prompt}
          className="mt-4 flex flex-wrap gap-2"
        >
          {destinations.map((d) => {
            const on = d.code === dest;
            return (
              <button
                key={d.code}
                type="button"
                aria-pressed={on}
                onClick={() => choose(d)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-pill px-4 text-[15px] font-semibold outline-none",
                  "transition-[background-color,color,box-shadow,translate] duration-300 ease-cx",
                  "focus-visible:shadow-[var(--cx-focus-ring)] motion-safe:active:translate-y-px",
                  on
                    ? "bg-foreground text-background"
                    : "bg-card text-foreground shadow-[inset_0_0_0_1px_var(--cx-hairline)] hover:shadow-[inset_0_0_0_1px_var(--cx-text-3)]",
                )}
              >
                {/* The one gold touch: the destination you have picked. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full bg-gold transition-[scale,opacity] duration-300 ease-(--cx-spring)",
                    on ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  )}
                />
                {d.city}
                <span
                  className={cn(
                    "text-[11px] font-bold tracking-[0.08em]",
                    on ? "opacity-70" : "text-text-3",
                  )}
                >
                  {d.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* What that destination needs. */}
      {/* Held at the tallest verdict's height on desktop, so picking another
          destination never shifts the page below. */}
      <div
        aria-live="polite"
        className="[grid-area:result] lg:col-span-5 lg:min-h-[32rem]"
      >
        {chosen ? (
          <div
            key={chosen.code}
            className="rounded-card bg-surface-2 p-6 ring-1 ring-hairline motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:slide-in-from-bottom-2 sm:p-7"
          >
            <p className="text-[12px] font-semibold tracking-[0.12em] text-text-3 uppercase">
              {chosen.city} · {chosen.country}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-[24px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
                {free ? copy.visaFree : chosen.label}
              </p>
              {!free ? (
                <Chip tone="brand">
                  <Icon name="clock" tone="current" size={14} />
                  {chosen.turnaround}
                </Chip>
              ) : null}
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground">
              {chosen.summary}
            </p>

            <p className="mt-5 text-[13px] font-semibold text-foreground">
              {copy.resultLabel}
            </p>
            <ol className="mt-3 grid gap-2.5">
              {chosen.next.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-bold text-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-[14px] leading-relaxed text-foreground">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
              <Icon name="info" tone="current" size={14} className="mt-0.5 shrink-0" />
              {copy.note}
            </p>
          </div>
        ) : (
          <p className="rounded-card p-6 text-[15px] leading-relaxed text-muted-foreground ring-1 ring-hairline ring-inset sm:p-7">
            {copy.browsing}
          </p>
        )}
      </div>

      {/* The deck. */}
      <div className="[grid-area:deck] lg:col-span-7">
        <div
          ref={deckRef as React.Ref<HTMLDivElement>}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipe.current = null)}
          className="relative grid touch-pan-y place-items-center px-2 py-6 [--fan:9%] sm:[--fan:14%] lg:py-10 lg:[--fan:17%]"
        >
          <ul aria-label={copy.deckLabel} className="grid w-full place-items-center">
            {cards.map((card, i) => {
              const slot = slotOf(i, front, count);
              return (
                <li
                  key={card.route}
                  className={cn(
                    "group/card relative w-[min(100%,20rem)] [grid-area:1/1] sm:w-[22rem] lg:w-[23rem]",
                    "transition-[transform,opacity] duration-700 ease-(--cx-spring)",
                  )}
                  style={{
                    transform: fanTransform(slot, free),
                    zIndex: slot === 0 ? 3 : slot === 1 ? 2 : 1,
                  }}
                >
                  <div
                    className={cn(
                      "transition-[translate] duration-500 ease-(--cx-spring)",
                      slot !== 0 && "motion-safe:group-hover/card:-translate-y-3",
                    )}
                  >
                    <TiltCard max={slot === 0 ? 6 : 3} className="rounded-card">
                      <DeckCard card={card} front={slot === 0} />
                      {/* A veil on the cards behind, so the deck reads as depth. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-0 z-[3] rounded-card bg-background/45 transition-opacity duration-500",
                          slot === 0 && !free ? "opacity-0" : "opacity-100",
                        )}
                      />
                    </TiltCard>
                  </div>
                  {slot !== 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!swiped.current) bring(i);
                      }}
                      className="absolute inset-0 z-10 cursor-pointer rounded-card outline-none focus-visible:shadow-[var(--cx-focus-ring)]"
                    >
                      <span className="sr-only">
                        {copy.showCard} {card.name}
                      </span>
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* A visa-free trip: the deck steps back and this slip lies over it. */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute z-20 w-[min(88%,19rem)] rounded-card bg-card p-6 text-center shadow-[0_30px_60px_-30px_rgb(8_20_50/0.55)] ring-1 ring-hairline",
              "transition-[opacity,translate,rotate] duration-500 ease-(--cx-spring)",
              free
                ? "rotate-[-3deg] opacity-100"
                : "translate-y-6 rotate-[4deg] opacity-0",
            )}
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-wash text-ember-text">
              <Icon name="check" tone="current" size={22} />
            </span>
            <p className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
              {copy.visaFree}
            </p>
            {chosen ? (
              <p className="mt-1 text-[14px] text-muted-foreground">{chosen.country}</p>
            ) : null}
          </div>
        </div>

        {/* Arrows and position, for anyone who will not swipe or click a card. */}
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => bring(front - 1)}
            aria-label={copy.previous}
            className="cx-btn cx-btn--ghost cx-btn--icon"
          >
            <Icon name="chevron-left" tone="current" size={18} />
          </button>
          <span aria-hidden="true" className="flex items-center">
            {cards.map((card, i) => (
              <span
                key={card.route}
                className={cn(
                  "h-1.5 w-5 rounded-full transition-[scale,background-color] duration-300 ease-(--cx-spring)",
                  i === front && !free
                    ? "scale-x-100 bg-ember"
                    : "scale-x-[0.3] bg-hairline",
                )}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={() => bring(front + 1)}
            aria-label={copy.next}
            className="cx-btn cx-btn--ghost cx-btn--icon"
          >
            <Icon name="chevron-right" tone="current" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** One kind of visa: its photograph with the turnaround, then what it is. */
function DeckCard({ card, front }: { card: VisaDeckCard; front: boolean }) {
  return (
    <Card
      elevated
      className={cn(
        "gap-0 p-2",
        front
          ? "shadow-[0_40px_70px_-36px_rgb(8_20_50/0.55)]"
          : "shadow-[0_16px_36px_-24px_rgb(8_20_50/0.4)]",
      )}
    >
      <div className="tint-brand relative isolate aspect-[16/10] overflow-hidden rounded-[12px]">
        <Image
          src={card.image.src}
          alt={card.image.alt}
          fill
          sizes="(max-width: 640px) 80vw, 368px"
          draggable={false}
          style={{ objectPosition: card.focus }}
          className="-z-10 object-cover"
        />
        <Chip glass className="absolute top-3 left-3 z-[2]">
          <Icon name="clock" tone="current" size={14} />
          {card.tag}
        </Chip>
      </div>
      <div className="px-3 pt-5 pb-4 sm:px-4">
        <div className="flex items-center gap-3.5">
          <IconTile name={card.icon} variant="glass" size="sm" />
          <h3 className="text-[20px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
            {card.name}
          </h3>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {card.body}
        </p>
      </div>
    </Card>
  );
}
