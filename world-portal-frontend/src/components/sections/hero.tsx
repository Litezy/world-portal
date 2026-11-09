"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { preload } from "react-dom";

import type { HeroPaperApi } from "@/components/motion/hero-paper";
import {
  applyScene,
  clamp01,
  type SceneElements,
  type SceneMode,
} from "@/components/motion/hero-scene";
import { HeroForecastCard } from "@/components/sections/hero-forecast-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { hero } from "@/content/landing";
import { Chip } from "@/ds/components/chip";
import { Icon } from "@/ds/components/icon";
import { FlightSearch } from "@/features/flights/components/flight-search";
import { useIdleMount } from "@/hooks/use-idle-mount";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import styles from "@/components/sections/hero.module.css";

// The paper is an enhancement layered over a complete scene, so it must never
// block first paint or run on the server.
const HeroPaper = dynamic(
  () => import("@/components/motion/hero-paper").then((m) => m.HeroPaper),
  { ssr: false },
);

/** The image a plate draws, handed to the stylesheet as custom properties. */
function plateVars(vars: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(vars).map(([name, src]) => [`--${name}`, `url(${src})`]),
  ) as React.CSSProperties;
}

const WIDE = "(min-width: 1024px)";

/**
 * "Cleared for take-off".
 *
 * A visa application floats in a bright late-morning sky above the cumulus,
 * beside the headline, and an APPROVED stamp thumps onto it on load.
 * Scrolling folds it into a paper plane, crease by crease; it noses round,
 * launches into the cloud trailing a white contrail, and the cloud parts over
 * the Maldives lagoon (the same light, the same cumulus) as it glides down
 * beside the villas. Scrolling back up unfolds it into the form again.
 *
 * The copy's action is a flight search, laid out like a booking site (the
 * CTO, 2026-11-09), not a "Start my trip" button. From lg it also takes the
 * forecast card's place; phones and tablets keep the card for the arrival.
 *
 * One daylight world in both themes, so the copy is navy ink on the sky in
 * light and white in dark, each over its own gentle scrim; the chip's dot is
 * the hero's one touch of WorldStreet gold.
 *
 * Planes, back to front, each moving at its own rate: the sky (L0), the far
 * cloud band (L1), the copy and the forecast card (L2), the paper in one
 * WebGL canvas (L3), near wisps that cross in front of it (L4), and the lagoon
 * (L5) revealed beneath the cloud at the end.
 *
 * - **Motion allowed:** the section is a tall track (260vh from lg, 180vh
 *   below) with a sticky panel. One rAF loop reads the progress p once per
 *   frame, writes every DOM plane's transform and opacity
 *   (`applyScene`), and hands the same p to the paper, so the two can never
 *   drift. It runs only while the panel is on screen and the tab is visible.
 * - **Reduced motion:** no pin and no extra height. The static composition is
 *   the base CSS: sky, cloud band, copy, card, and a still of the plane.
 * - **No WebGL:** the same still, flying a simple 2D version of the path.
 *
 * Copy, plates and the sky render from the server; the paper fades in on
 * idle once its first frame is drawn, so first paint is never half a scene.
 */
export function Hero() {
  const reduced = usePrefersReducedMotion();
  const idle = useIdleMount();
  const [paper, setPaper] = React.useState<"loading" | "ready" | "failed">("loading");

  const sectionRef = React.useRef<HTMLElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const slotRef = React.useRef<HTMLDivElement>(null);
  const apiRef = React.useRef<HeroPaperApi | null>(null);
  const failed = paper === "failed";

  const { scene } = hero;
  // The cloud is on screen from the first frame, so its plates are wanted as
  // early as the sky. Mask images are fetched in CORS mode, so their preloads
  // must be too, or the browser downloads them twice.
  preload(scene.clouds.body, { as: "image", fetchPriority: "high" });
  preload(scene.clouds.matte, {
    as: "image",
    fetchPriority: "high",
    crossOrigin: "anonymous",
  });

  React.useEffect(() => {
    if (reduced) {
      // The first client render reads "no reduced motion" (the server's guess),
      // so the scene may already have written one frame; on a phone that left
      // the forecast card hidden (2026-11-09). The static composition is the
      // plain CSS, so clear what the scene wrote.
      panelRef.current
        ?.querySelectorAll<HTMLElement>(
          "[data-layer], [data-hero-copy], [data-hero-card]",
        )
        .forEach((el) => {
          el.style.transform = "";
          el.style.opacity = "";
          el.style.visibility = "";
        });
      return;
    }
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return;

    const pick = (layer: string) =>
      panel.querySelector<HTMLElement>(`[data-layer="${layer}"]`);
    const els: SceneElements = {
      sky: pick("sky"),
      lagoon: pick("lagoon"),
      farA: pick("far-a"),
      farB: pick("far-b"),
      nearA: pick("near-a"),
      nearB: pick("near-b"),
      scrim: pick("scrim"),
      copy: panel.querySelector<HTMLElement>("[data-hero-copy]"),
      card: panel.querySelector<HTMLElement>("[data-hero-card]"),
      fallback: failed ? pick("fallback") : null,
    };
    const wide = window.matchMedia(WIDE);

    // The scroll the pin consumes: the track's height less the panel's and
    // the track's own padding. Measured on resize, not per frame.
    let range = 1;
    const measure = () => {
      const pad = parseFloat(getComputedStyle(section).paddingTop) || 0;
      range = Math.max(1, section.offsetHeight - panel.offsetHeight - 2 * pad);
    };
    const progress = () => clamp01(-section.getBoundingClientRect().top / range);

    let raf = 0;
    let running = false;
    let inView = false;
    let lastP = -1;
    let lastMode: SceneMode | null = null;

    const draw = (now: number) => {
      const p = progress();
      const mode: SceneMode = wide.matches ? "wide" : "compact";
      if (p !== lastP || mode !== lastMode) {
        applyScene(els, p, mode);
        lastP = p;
        lastMode = mode;
      }
      apiRef.current?.render(p, now);
    };

    const tick = (now: number) => {
      if (!running) return;
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || !inView || document.visibilityState !== "visible") return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    io.observe(panel);

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    const onResize = () => {
      measure();
      lastP = -1;
      if (!running) draw(performance.now());
    };

    measure();
    // Land on the right frame straight away, e.g. on a reload mid-hero.
    draw(performance.now());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(section);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced, failed]);

  const onReady = React.useCallback(() => setPaper("ready"), []);
  const onFail = React.useCallback(() => setPaper("failed"), []);

  return (
    <section
      ref={sectionRef}
      data-hero
      className={cn(
        "relative p-2 motion-safe:h-[180vh] sm:p-3 lg:motion-safe:h-[260vh]",
      )}
    >
      <div
        ref={panelRef}
        className={cn(
          styles.panel,
          "relative isolate overflow-hidden",
          "rounded-[1.75rem] sm:rounded-[2rem] lg:rounded-[2.5rem]",
          "min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-1.5rem)]",
          // Pinned: fills the viewport inside the track's inset, with a floor
          // for short windows.
          "motion-safe:sticky motion-safe:top-2 sm:motion-safe:top-3",
          "motion-safe:h-[max(calc(100svh-1rem),36rem)] sm:motion-safe:h-[max(calc(100svh-1.5rem),36rem)]",
        )}
      >
        {/* L0 — the sky. The LCP image. */}
        <div data-layer="sky" className={cn(styles.plane, styles.sky)}>
          <Image
            src={scene.sky}
            alt=""
            fill
            preload
            sizes="100vw"
            quality={90}
            className={cn("object-cover object-[50%_40%]")}
          />
        </div>

        {/* L5 — the lagoon, under the cloud deck until the arrival. */}
        <div
          data-layer="lagoon"
          aria-hidden="true"
          className={cn(styles.plane, styles.lagoon, "z-[1]")}
        >
          {/* Below lg the crop slides toward the villas (keep in step with
              LAGOON.focus in hero-paper.tsx, which lands the plane beside
              them). */}
          <Image
            src={hero.image.src}
            alt=""
            fill
            sizes="100vw"
            quality={90}
            className="object-cover max-lg:object-[72%_50%]"
          />
        </div>

        {/* L1 — the far cloud band: one cloud field in two halves that part. */}
        <div aria-hidden="true" className={cn(styles.deck, "z-[2]")}>
          {(["far-a", "far-b"] as const).map((layer) => (
            <div
              key={layer}
              data-layer={layer}
              className={cn(
                styles.plate,
                styles.far,
                layer === "far-a" ? styles.farA : styles.farB,
              )}
              style={plateVars({ plate: scene.clouds.body, matte: scene.clouds.matte })}
            />
          ))}
        </div>

        {/* A gentle scrim only where the copy sits, and only while it is
            there: pale sky under navy ink, navy under white ink in dark. */}
        <div
          data-layer="scrim"
          aria-hidden="true"
          className={cn(styles.scrim, "pointer-events-none absolute inset-0 z-[3]")}
        />

        {/* L2 — the copy and the forecast card. */}
        <Container
          size="content"
          className={cn(
            "relative z-[4] flex flex-col pt-24 pb-5 sm:pt-28 sm:pb-8 lg:pt-32 lg:pb-11",
            "min-h-[inherit] motion-safe:h-full",
            "[@media(min-width:1024px)_and_(max-height:820px)]:pt-24 [@media(min-width:1024px)_and_(max-height:820px)]:pb-6",
          )}
        >
          <div data-hero-copy className={cn("flex origin-left items-center lg:flex-1")}>
            <div
              data-hero-stack
              className={cn(
                styles.stack,
                "flex w-full max-w-[38rem] flex-col items-start text-left lg:max-w-[40rem]",
              )}
            >
              {/* Glass that follows the theme; its dot is the hero's one
                  touch of WorldStreet gold. */}
              <Chip
                glass
                dot
                className={cn("h-8 px-3.5 text-[0.8125rem] before:bg-gold")}
              >
                {hero.badge}
              </Chip>

              <SectionHeading
                as="h1"
                size="lg"
                align="left"
                lead={hero.headingLead}
                accent={hero.headingAccent}
                className={cn(
                  "mt-6 [&_h1]:text-brand-950 dark:[&_h1]:text-white",
                  "[&_h1]:text-[2rem] [&_h1]:leading-[1.04] sm:[&_h1]:text-[3.5rem]",
                  "lg:[&_h1]:text-[4rem] xl:[&_h1]:text-[4.25rem]",
                  "[@media(min-width:1024px)_and_(max-height:820px)]:mt-5 [@media(min-width:1024px)_and_(max-height:820px)]:[&_h1]:text-[3.5rem]",
                  // The serif half always takes its own line.
                  "[&_.heading-serif]:block",
                )}
              />

              {/* Phones give the line's room to the search. */}
              <p
                className={cn(
                  "mt-6 max-w-[31rem] text-base leading-relaxed text-pretty max-sm:hidden sm:text-lg",
                  "text-brand-950/80 dark:text-white/85",
                  "[@media(min-width:1024px)_and_(max-height:820px)]:mt-4",
                )}
              >
                {hero.lead}
              </p>

              {/* The first thing to do here is say where you are going, the way a
                  flight booking site opens (the CTO, 2026-11-09). */}
              <FlightSearch
                className={cn(
                  "mt-6 sm:mt-8",
                  "[@media(min-width:1024px)_and_(max-height:820px)]:mt-6",
                )}
              />

              <p
                className={cn(
                  "mt-3 px-1 text-[0.875rem] text-brand-950/75 dark:text-white/80",
                )}
              >
                {hero.planLink.lead}{" "}
                <Link
                  href={hero.planLink.href}
                  className={cn(
                    "inline-flex items-center gap-1 font-semibold text-brand-950 underline-offset-4 hover:underline dark:text-white",
                  )}
                >
                  {hero.planLink.label}
                  <Icon name="arrow-right" tone="current" size={14} />
                </Link>
              </p>
            </div>
          </div>

          {/* Where the paper rests: right of the copy from lg, under it below.
              The canvas reads this box; reduced motion and a failed WebGL
              show the still here instead. */}
          <div
            ref={slotRef}
            data-hero-slot
            aria-hidden="true"
            className={cn(
              "pointer-events-none relative",
              "lg:absolute lg:top-[14%] lg:right-[2%] lg:bottom-[13%] lg:left-[55%]",
              "max-lg:mt-6 max-lg:min-h-[9rem] max-lg:flex-1",
            )}
          >
            <div
              data-layer="fallback"
              className={cn(
                "absolute inset-[6%]",
                failed ? "block" : "hidden motion-reduce:block",
              )}
            >
              <Image
                src={scene.still}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-contain"
              />
            </div>
          </div>

          <div
            data-hero-card
            className={cn(
              "mt-8 sm:max-w-[36rem] lg:hidden",
              // Phones and tablets: the card belongs to the arrival, over the
              // lagoon at the foot of the panel.
              "max-lg:motion-safe:invisible max-lg:motion-safe:absolute max-lg:motion-safe:inset-x-4 max-lg:motion-safe:bottom-4 max-lg:motion-safe:mt-0 max-lg:motion-safe:opacity-0",
              "sm:max-lg:motion-safe:inset-x-8",
            )}
          >
            <HeroForecastCard className={cn(styles.card)} />
          </div>
        </Container>

        {/* L3 — the paper. */}
        {idle && !reduced && !failed ? (
          <HeroPaper
            apiRef={apiRef}
            slotRef={slotRef}
            onReady={onReady}
            onFail={onFail}
            className={cn(
              styles.paper,
              "pointer-events-none absolute inset-0 z-[5] size-full",
            )}
            ready={paper === "ready"}
          />
        ) : null}

        {/* L4 — near wisps, crossing in front of the paper. */}
        <div aria-hidden="true" className={cn(styles.deck, "z-[6]")}>
          <div
            data-layer="near-a"
            className={cn(styles.plate, styles.near, styles.nearWisps)}
            style={plateVars({ plate: scene.clouds.nearWisps })}
          />
          <div
            data-layer="near-b"
            className={cn(styles.plate, styles.near)}
            style={plateVars({ plate: scene.clouds.nearBank })}
          />
        </div>
      </div>
    </section>
  );
}
