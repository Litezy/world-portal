"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hero } from "@/content/landing";
import { useGsap } from "@/hooks/use-gsap";
import { EASE_GLASS, gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

// WebGL is an enhancement layered over the real <Image>, so it must never
// block first paint or run on the server.
const HeroWebgl = dynamic(
  () => import("@/components/motion/hero-webgl").then((m) => m.HeroWebgl),
  { ssr: false },
);

const WebglWordmark = dynamic(
  () => import("@/components/motion/webgl-wordmark").then((m) => m.WebglWordmark),
  { ssr: false },
);

/**
 * Full-bleed photograph under a dark scrim, with the centred badge / lead /
 * CTA stack and the oversized serif wordmark flush to the bottom edge.
 *
 * On load the wordmark rises out from behind that edge; afterwards it drifts
 * with the scroll along with the plate behind it.
 */
export function Hero() {
  const [webglReady, setWebglReady] = React.useState(false);
  const [wordmarkReady, setWordmarkReady] = React.useState(false);

  // Only mount the shader once the browser is idle — it is decoration.
  React.useEffect(() => {
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => setWebglReady(true), { timeout: 2500 })
      : window.setTimeout(() => setWebglReady(true), 1200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  const scopeRef = useGsap(({ scope }) => {
    if (!scope) return;

    const tl = gsap.timeline({ delay: 0.15 });

    tl.from("[data-hero-stack] > *", {
      y: 22,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: EASE_GLASS,
    }).from(
      "[data-hero-fallback]",
      {
        // Only ever seen if WebGL is unavailable — the shader owns the reveal
        // otherwise, and hides this the moment its texture is ready.
        yPercent: 108,
        duration: 1.5,
        ease: "expo.out",
      },
      "-=0.55",
    );

    // Afterwards the wordmark drifts a little slower than the page.
    gsap.to("[data-hero-wordmark]", {
      yPercent: -14,
      ease: "none",
      scrollTrigger: {
        trigger: scope,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, []);

  return (
    <section
      ref={scopeRef as React.Ref<HTMLElement>}
      className="relative isolate flex min-h-[92vh] flex-col justify-end overflow-hidden lg:min-h-screen"
    >
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        priority
        sizes="100vw"
        className="-z-30 object-cover"
      />

      {webglReady ? (
        <HeroWebgl src={hero.image.src} className="absolute inset-0 -z-20 size-full" />
      ) : null}

      {/* Dark scrim: an even wash so no part of the photograph competes with
          the type, plus a gradient that deepens under the header and the
          wordmark. Tuned so the lagoon still reads clearly underneath. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink-950/28" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,9,14,0.55)_0%,rgba(6,9,14,0.16)_28%,rgba(6,9,14,0.14)_54%,rgba(6,9,14,0.52)_100%)]"
      />

      <div className="flex flex-1 items-center justify-center px-5 pt-28 pb-10 sm:px-8">
        <div
          data-hero-stack
          className="flex max-w-xl flex-col items-center text-center"
        >
          <Badge variant="glassDark" size="md" dot dotClassName="bg-primary">
            {hero.badge}
          </Badge>

          <p className="mt-6 text-[15px] leading-relaxed text-balance text-white/90 sm:text-[17px]">
            {hero.lead}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href={hero.cta.href}>{hero.cta.label}</Link>
            </Button>
            <Button asChild variant="glassDark" size="lg">
              <Link href="#visas">See our services</Link>
            </Button>
          </div>
        </div>
      </div>

      {/*
        The wordmark is rendered twice on purpose: a real text node that is
        always correct, and a WebGL plate that replaces it once its texture is
        ready. Without WebGL, reduced motion, or before hydration, what you see
        is the text — the shader is never load-bearing.
      */}
      <div
        data-hero-wordmark
        className="relative overflow-hidden"
        style={{ height: "16vw" }}
      >
        <span
          data-hero-fallback
          aria-hidden="true"
          className={cn(
            "heading-serif absolute inset-x-0 bottom-0 block text-center text-[19.9vw] leading-[0.8] font-normal tracking-[-0.012em] text-white transition-opacity duration-500 select-none",
            wordmarkReady && "opacity-0",
          )}
        >
          {hero.wordmark}
        </span>

        {webglReady ? (
          <WebglWordmark
            text={hero.wordmark}
            onReady={() => setWordmarkReady(true)}
            className="absolute inset-0 size-full"
          />
        ) : null}
      </div>
      <span className="sr-only">{hero.wordmark}</span>
    </section>
  );
}
