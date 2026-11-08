"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { vividCopy } from "@/content/vivid";
import { Icon } from "@/ds/components/icon";
import { cn } from "@/lib/utils";

import { useLandingScroll } from "./use-landing-scroll";
import { VividGlobe } from "./vivid-globe";

const ROTATE_MS = 3500;

const noop = () => () => {};

/**
 * Ask Vivid, adapted from WorldStreet's Ask Vivid dock: a glassy pill
 * floating at the bottom centre of the landing page, with Vivid's gold globe
 * on the left (vivid-globe.tsx, on its night-blue coin), the questions people
 * actually have cycling in the middle, and a blue "Ask Vivid" button on the
 * right.
 *
 * The difference from WorldStreet's: Vivid on E-Embassy is voice only, so
 * there is no question to hand to a chat page. The whole pill is ONE button
 * that starts the same voice session the corner orb starts (sign-in is
 * offered first when needed, exactly as before). The cycling questions are
 * suggestions of what to say.
 *
 * It arrives once the hero has mostly scrolled away (use-landing-scroll.ts),
 * so it never sits on the hero's forecast card or its calls to action, and
 * steps aside while "How it works" holds the screen: that section pins a
 * full-viewport stage, and the pill would sit on its flight-path strip for
 * the whole sequence. md and up only: phones keep the corner orb (see
 * VividVoiceControl). Rotation pauses on hover and focus, and under reduced
 * motion it shows the first question and never moves.
 */
export function VividAskPill({ onStart }: { onStart: () => void }) {
  // The reduced-motion preference is only known in the browser. Reading it
  // during hydration renders different markup from the server's (the hidden
  // pill's offset), so it counts only once the component has mounted.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const prefersReduced = useReducedMotion();
  const reduce = mounted && Boolean(prefersReduced);
  const { prompts } = vividCopy.ask;

  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const still = reduce || held;

  useEffect(() => {
    if (still) return;
    const id = window.setInterval(
      () => setIndex((n) => (n + 1) % prompts.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [still, prompts.length]);

  const { pastHero, inJourney, atFooter } = useLandingScroll();
  // Steps aside at the footer too, where it would sit on the landing plane.
  const past = pastHero && !inJourney && !atFooter;

  const prompt = prompts[reduce ? 0 : index % prompts.length];

  return (
    // data-brand: this mounts at the root, outside the landing page's brand
    // wrapper, and the design system's button would otherwise be its default.
    <div
      data-brand="e-embassy"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 hidden justify-center px-8 md:flex"
    >
      <motion.div
        initial={false}
        animate={past ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 24 }}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 260, damping: 26, mass: 0.9 }
        }
        className={cn(
          "w-full max-w-[560px]",
          past ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={past ? undefined : true}
      >
        <button
          type="button"
          onClick={onStart}
          tabIndex={past ? undefined : -1}
          aria-label={vividCopy.ask.label}
          onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
          className={cn(
            "group cx-beam cx-beam--slow flex w-full items-center gap-3 rounded-full py-1.5 pr-1.5 pl-1.5 text-left",
            "bg-elevated/80 ring-1 ring-hairline backdrop-blur-xl backdrop-saturate-150",
            "shadow-[0_22px_50px_-16px_rgba(0,0,0,0.7),0_2px_8px_-2px_rgba(0,0,0,0.3)]",
            "in-data-[theme=light]:shadow-[0_18px_40px_-16px_rgba(7,31,69,0.3),0_2px_6px_-2px_rgba(7,31,69,0.12)]",
            "transition-[background-color,box-shadow] duration-300 hover:bg-elevated/95",
            "outline-none focus-visible:ring-2 focus-visible:ring-ember",
          )}
        >
          <VividGlobe size={40} backdrop still={!past} />

          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="text-[11.5px] leading-4 font-semibold text-muted-foreground">
              {vividCopy.ask.lead}
            </span>
            <span className="relative block min-h-5" aria-hidden="true">
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={prompt}
                  className="absolute inset-0 flex items-center text-[14.5px] leading-5 font-medium text-foreground"
                  initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduce ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="line-clamp-1 min-w-0">&ldquo;{prompt}&rdquo;</span>
                </motion.span>
              </AnimatePresence>
            </span>
          </span>

          <span
            aria-hidden="true"
            className="cx-btn cx-btn--sm !h-10 shrink-0 !gap-1.5 !px-5 !text-[14px] font-semibold [&>svg]:transition-transform [&>svg]:duration-300 group-hover:[&>svg]:translate-x-[3px]"
          >
            {vividCopy.ask.button}
            <Icon name="arrow-right" size={15} tone="current" />
          </span>
        </button>
      </motion.div>
    </div>
  );
}
