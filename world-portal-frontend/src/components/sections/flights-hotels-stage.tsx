"use client";

import * as React from "react";
import Image from "next/image";

import { flightsHotels } from "@/content/landing";
import { Icon } from "@/ds/components/icon";
import { useGsap } from "@/hooks/use-gsap";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

const { stage } = flightsHotels;

/** Teeth along the torn edge, and how far each one bites into the pass. */
const TEETH = 24;
const BITE = 9;

/**
 * The pass's visible region: everything right of the tear, with a ragged
 * perforated edge. `t` is 0..1 across the stage.
 */
function tearPath(t: number) {
  const x = (t * 100).toFixed(3);
  const points = [`${x}% 0%`, "100% 0%", "100% 100%", `${x}% 100%`];
  for (let i = TEETH; i > 0; i--) {
    const mid = (((i - 0.5) / TEETH) * 100).toFixed(2);
    const top = (((i - 1) / TEETH) * 100).toFixed(2);
    points.push(`calc(${x}% + ${BITE}px) ${mid}%`, `${x}% ${top}%`);
  }
  return `polygon(${points.join(",")})`;
}

/**
 * Flights & Hotels' signature: a boarding pass that tears away, as the visitor
 * scrolls, to the room key underneath. One ticket becomes the other — the
 * section's promise (the seat and the room, sorted together) told as a single
 * object rather than a gallery.
 *
 * Normal flow, no pin: the two tickets share one grid cell, and a scrubbed
 * tween drives one progress value that sets the tear (`clip-path` on the pass),
 * the curl shadow riding the tear, a slow settle on the hotel photograph and
 * the seat → room rail under the stage. Everything is a function of that one
 * value, so scrolling back up mends the pass.
 *
 * Reduced motion (and before the tween is built) is the complete static
 * composition: the two tickets side by side from md, stacked on a phone, no
 * rail. The tickets use container queries, so the same markup is a wide
 * ticket on the stage and a tall one in half the width.
 */
export function FlightsHotelsStage() {
  const passRef = React.useRef<HTMLElement>(null);
  const seamRef = React.useRef<HTMLDivElement>(null);
  const passImageRef = React.useRef<HTMLDivElement>(null);
  const roomImageRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLSpanElement>(null);
  const seatStepRef = React.useRef<HTMLSpanElement>(null);
  const roomStepRef = React.useRef<HTMLSpanElement>(null);

  const scopeRef = useGsap(({ scope }) => {
    const pass = passRef.current;
    const seam = seamRef.current;
    if (!scope || !pass || !seam) return;

    const ease = gsap.parseEase("power2.inOut");
    const state = { p: 0 };
    const nodes = [
      pass,
      seam,
      passImageRef.current,
      roomImageRef.current,
      fillRef.current,
      seatStepRef.current,
      roomStepRef.current,
    ];

    const render = () => {
      const t = ease(state.p);
      pass.style.clipPath =
        t <= 0.001 ? "" : t >= 0.999 ? "inset(0 0 0 100%)" : tearPath(t);
      seam.style.transform = `translate3d(${t * 100}%,0,0)`;
      seam.style.opacity = String(Math.min(1, t * 14));
      if (passImageRef.current) {
        passImageRef.current.style.transform = `translate3d(${t * 5}%,0,0)`;
      }
      if (roomImageRef.current) {
        roomImageRef.current.style.transform = `scale(${1.1 - 0.1 * t})`;
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${t})`;
      if (seatStepRef.current) seatStepRef.current.style.opacity = String(1 - 0.5 * t);
      if (roomStepRef.current)
        roomStepRef.current.style.opacity = String(0.5 + 0.5 * t);
    };

    gsap.to(state, {
      p: 1,
      ease: "none",
      onUpdate: render,
      scrollTrigger: {
        trigger: scope,
        start: "top 70%",
        end: "top 12%",
        scrub: 0.6,
      },
    });
    render();

    // Inline styles are ours, not GSAP's, so put them back by hand.
    return () => {
      for (const node of nodes) {
        if (!node) continue;
        node.style.clipPath = "";
        node.style.transform = "";
        node.style.opacity = "";
      }
    };
  }, []);

  return (
    <figure ref={scopeRef as React.Ref<HTMLElement>} className="m-0">
      <figcaption className="sr-only">{stage.description}</figcaption>

      <div className="grid motion-reduce:gap-4 motion-reduce:md:grid-cols-2 motion-reduce:md:gap-5">
        {/* The pass is first for reading order and sits on top (z-10); the
            room key waits underneath in the same cell. */}
        <Ticket
          ref={passRef}
          kind="pass"
          imageRef={passImageRef}
          className="z-10 [grid-area:1/1] motion-reduce:[grid-area:auto]"
        >
          <div
            ref={seamRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-0"
          >
            {/* The curl: the pass lifts off along the tear. */}
            <span className="absolute inset-y-0 left-0 w-12 bg-linear-to-r from-ink-950/30 via-ink-950/10 to-transparent" />
          </div>
        </Ticket>
        <Ticket
          kind="room"
          imageRef={roomImageRef}
          className="[grid-area:1/1] motion-reduce:[grid-area:auto]"
        />
      </div>

      {/* Where the tear has got to: the seat, then the room. Decorative — the
          two tickets carry the same words. */}
      <div
        aria-hidden="true"
        className="mt-6 flex items-center gap-4 text-[13px] font-semibold tracking-[-0.005em] text-foreground motion-reduce:hidden sm:mt-7"
      >
        <span ref={seatStepRef} className="flex items-center gap-2">
          <Icon name="send" tone="current" size={16} className="text-ember-text" />
          {stage.pass.step}
        </span>
        <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-hairline">
          <span
            ref={fillRef}
            style={{ transform: "scaleX(0)" }}
            className="absolute inset-0 origin-left rounded-full bg-linear-to-r from-cyan-500 to-ember"
          />
        </span>
        <span ref={roomStepRef} className="flex items-center gap-2 opacity-50">
          {stage.room.step}
          <Icon name="key" tone="current" size={16} className="text-ember-text" />
        </span>
      </div>
    </figure>
  );
}

type TicketProps = {
  kind: "pass" | "room";
  imageRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
};

/**
 * One ticket: a photograph with the headline on it, a perforation, and the
 * paper stub with the details. Wide (photo beside stub) when the ticket is
 * at least 48rem across, tall (photo over stub) below that — measured on the
 * ticket itself, so the stage and the reduced-motion pair share one layout.
 */
function Ticket({ kind, imageRef, className, children, ref }: TicketProps) {
  const isPass = kind === "pass";
  const data = isPass ? stage.pass : stage.room;

  return (
    <article
      ref={ref}
      data-ticket={kind}
      className={cn(
        "@container relative isolate overflow-hidden rounded-[24px] bg-elevated text-foreground sm:rounded-[28px]",
        "shadow-[0_1px_0_0_rgb(255_255_255/0.6)_inset,0_24px_60px_-28px_rgb(7_31_69/0.45)] ring-1 ring-hairline",
        className,
      )}
    >
      <div className="flex h-full flex-col @3xl:flex-row">
        {/* The photograph, with the headline set on it. */}
        <div className="relative min-h-[230px] flex-1 overflow-hidden bg-ink-950 sm:min-h-[280px] @3xl:min-h-[400px]">
          <div
            ref={imageRef}
            className={cn(
              "absolute inset-0 will-change-transform",
              isPass && "-inset-x-[6%]",
            )}
          >
            <Image
              src={data.image.src}
              alt={data.image.alt}
              fill
              sizes="(max-width: 768px) 92vw, (max-width: 1280px) 60vw, 860px"
              className={cn("object-cover", isPass && "object-[50%_58%]")}
            />
          </div>
          {/* Scrim: heaviest under the headline, so white type always reads. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-ink-950/80 via-ink-950/25 to-ink-950/10 @3xl:bg-linear-to-tr @3xl:from-ink-950/75 @3xl:via-ink-950/25 @3xl:to-transparent"
          />

          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 sm:inset-x-5 sm:top-5">
            <span className="glass-dark flex h-8 items-center gap-2 rounded-pill pr-3.5 pl-2.5 text-[12.5px] font-semibold text-white">
              <Icon name={isPass ? "send" : "key"} tone="current" size={15} />
              {data.kicker}
            </span>
            <span className="glass-dark flex h-8 items-center rounded-pill px-3 text-[12px] font-medium text-white/85">
              {stage.label}
            </span>
          </div>

          <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-7 sm:bottom-7">
            {isPass ? (
              <div className="flex items-end gap-4 sm:gap-6">
                <Airport code={stage.pass.from.code} city={stage.pass.from.city} />
                <span
                  aria-hidden="true"
                  className="mb-[1.6rem] flex flex-1 items-center gap-2 text-white/70 @3xl:mb-[2.1rem] @3xl:max-w-[220px]"
                >
                  <span className="h-px flex-1 border-t border-dashed border-white/50" />
                  <Icon name="send" tone="current" size={18} className="rotate-45" />
                  <span className="h-px flex-1 border-t border-dashed border-white/50" />
                </span>
                <Airport code={stage.pass.to.code} city={stage.pass.to.city} />
              </div>
            ) : (
              <div>
                <p className="text-[40px] leading-[0.95] font-semibold tracking-[-0.04em] sm:text-[52px] @3xl:text-[68px]">
                  {stage.room.name}
                </p>
                <p className="mt-2 text-[14px] font-medium text-white/80">
                  {stage.room.place}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* The stub: perforated from the photo, with a notch at each end. */}
        <div className="relative flex flex-col justify-between gap-7 border-t-2 border-dashed border-hairline p-6 sm:p-7 @3xl:w-[340px] @3xl:border-t-0 @3xl:border-l-2 @3xl:p-8">
          <span
            aria-hidden="true"
            className="absolute -top-3 -left-3 size-6 rounded-full bg-background"
          />
          <span
            aria-hidden="true"
            className="absolute -top-3 -right-3 size-6 rounded-full bg-background @3xl:top-auto @3xl:right-auto @3xl:-bottom-3 @3xl:-left-3"
          />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
            {data.rows.map((row) => (
              <div key={row.label}>
                <dt className="text-[11px] font-semibold tracking-[0.14em] text-text-3 uppercase">
                  {row.label}
                </dt>
                <dd className="mt-1 text-[22px] leading-tight font-semibold tracking-[-0.02em] tabular-nums sm:text-[24px]">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {isPass ? (
            <div className="flex flex-col gap-4">
              <p className="flex items-center gap-2.5 text-[13.5px] font-medium text-foreground">
                <Icon
                  name="check-circle"
                  tone="current"
                  size={16}
                  className="shrink-0 text-ember-text"
                />
                {stage.pass.note}
              </p>
              <Barcode />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2.5 text-[13.5px] font-medium text-foreground">
                {/* The section's one gold touch: the hold light. */}
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full bg-gold shadow-[0_0_0_4px_var(--color-gold-wash)]"
                />
                {stage.room.status}
              </p>
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-[10px] bg-surface-2 text-foreground/70"
              >
                <Icon name="nfc" tone="current" size={20} />
              </span>
            </div>
          )}
        </div>
      </div>

      {children}
    </article>
  );
}

function Airport({ code, city }: { code: string; city: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-[44px] leading-none font-semibold tracking-[-0.04em] sm:text-[56px] @3xl:text-[76px]">
        {code}
      </span>
      <span className="mt-2 text-[13px] font-medium text-white/80">{city}</span>
    </span>
  );
}

/** A printed barcode, drawn in the ticket's ink so it follows the theme. */
function Barcode() {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-11 w-full text-foreground/85",
        "bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_4px,currentColor_4px_5px,transparent_5px_9px,currentColor_9px_12px,transparent_12px_14px,currentColor_14px_15px,transparent_15px_19px)]",
      )}
    />
  );
}
