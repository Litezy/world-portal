"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";

import { X } from "lucide-react";

import { vividCopy } from "@/content/vivid";
import type { VividAgentState } from "@/features/vivid/types";
import { cn } from "@/lib/utils";

import { useSiraVivid } from "./sira-provider";
import { useLandingScroll } from "./use-landing-scroll";
import { VividAskPill } from "./vivid-ask-pill";
import { VividGlobe } from "./vivid-globe";

/**
 * Vivid's presence on the page, in two forms (as on every WorldStreet app).
 *
 * Vivid's mark is WorldStreet's: the gold dot globe (vivid-globe.tsx), on
 * E-Embassy's night-blue coin.
 *
 * Idle: the globe alone in the bottom-right corner. Tap to start. On the
 * landing page, from md up, it is the Ask Vivid pill at the bottom centre
 * instead (vivid-ask-pill.tsx), the way WorldStreet's home shows Vivid.
 * Phones keep the corner globe, and on the landing page it waits, like the
 * pill, until the hero has scrolled past, so it never covers the paper plane
 * or its arrival card. Everywhere else it is always there.
 *
 * Live: the globe docks into a slim ink capsule centred at the bottom of the
 * screen, turning faster and swelling with the voice, that says who is
 * listening and always shows the way out. The page stays the star; the
 * capsule is furniture.
 */

/** State dot inside the live capsule. */
const STATE_DOT: Record<VividAgentState, string> = {
  idle: "bg-white/40",
  connecting: "bg-brand-400 animate-pulse",
  ready: "bg-emerald-400",
  listening: "bg-brand-400 animate-pulse",
  processing: "bg-brand-400 animate-pulse",
  speaking: "bg-emerald-400 animate-pulse",
  error: "bg-destructive",
};

// Nobody talking for this long — Vivid finished and the applicant silent —
// ends the session, so a forgotten tab never keeps a live mic.
const IDLE_END_MS = 30_000;

const NOOP = () => {};
const NO_LEVELS = () => new Uint8Array(0);

export function VividVoiceControl() {
  const vivid = useSiraVivid();
  const pathname = usePathname();
  const state = vivid?.state ?? "idle";
  const isConnected = vivid?.isConnected ?? false;
  const startSession = vivid?.startSession;
  const endSession = vivid?.endSession ?? NOOP;
  const getAudioLevels = vivid?.getAudioLevels ?? NO_LEVELS;

  const isLive = state !== "idle" && state !== "error";
  const landing = pathname === "/";
  // Phones on the landing page: the corner globe waits for the hero to go.
  const { pastHero } = useLandingScroll(landing);
  const cornerShown = !landing || pastHero;

  // "ready" is the only quiet state; any transition re-arms the timer.
  useEffect(() => {
    if (state !== "ready") return;
    const timer = setTimeout(() => endSession(), IDLE_END_MS);
    return () => clearTimeout(timer);
  }, [state, endSession]);

  const start = useCallback(async () => {
    if (state === "connecting") return;
    if (!isConnected) await startSession?.();
  }, [state, isConnected, startSession]);

  if (!isLive) {
    return (
      <>
        {landing ? <VividAskPill onStart={() => void start()} /> : null}
        <div
          inert={!cornerShown}
          className={cn(
            "fixed right-5 bottom-5 z-50 max-md:bottom-20",
            "transition-[opacity,translate] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            !cornerShown && "pointer-events-none translate-y-6 opacity-0",
            landing && "md:hidden",
          )}
        >
          <button
            type="button"
            onClick={() => void start()}
            aria-label={vividCopy.talk}
            title={vividCopy.talk}
            className={cn(
              "block rounded-full outline-none",
              "shadow-[0_14px_30px_-12px_rgb(7_31_69/0.55),0_2px_6px_-2px_rgb(7_31_69/0.25)] dark:shadow-[0_14px_30px_-12px_rgb(0_0_0/0.8),0_2px_6px_-2px_rgb(0_0_0/0.4)]",
              "transition-transform duration-200 hover:scale-[1.06] active:scale-95 motion-reduce:transition-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <VividGlobe size={60} backdrop still={!cornerShown} />
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 max-md:bottom-20">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink-950/90 py-1.5 pr-2 pl-1.5 shadow-[0_12px_40px_rgba(5,13,36,0.35)] backdrop-blur-xl">
        <span role="img" aria-label={vividCopy.name} className="shrink-0">
          <VividGlobe size={40} backdrop active getAudioLevels={getAudioLevels} />
        </span>

        <div
          className="flex items-center gap-2 pr-1.5 pl-2 select-none"
          aria-live="polite"
        >
          <span className={cn("size-1.5 rounded-full", STATE_DOT[state])} />
          <span className="min-w-16 text-[12.5px] font-medium text-white/90">
            {vividCopy.states[state]}
          </span>
        </div>

        <span className="h-5 w-px bg-white/10" aria-hidden />

        <button
          type="button"
          onClick={() => endSession()}
          aria-label={vividCopy.end}
          title={vividCopy.end}
          className="relative flex size-9 items-center justify-center rounded-full bg-destructive/20 text-red-300 transition-colors duration-150 hover:bg-destructive hover:text-white"
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
