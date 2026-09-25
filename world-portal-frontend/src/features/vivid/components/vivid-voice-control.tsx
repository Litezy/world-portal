"use client";

import { useCallback, useEffect } from "react";

import { X } from "lucide-react";

import { vividCopy } from "@/content/vivid";
import type { VividAgentState } from "@/features/vivid/types";
import { cn } from "@/lib/utils";

import SilkOrb from "./silk-orb";
import { useSiraVivid } from "./sira-provider";

/**
 * Vivid's presence on the page, in two forms (as on every WorldStreet app).
 *
 * Idle: the silk orb alone in the bottom-right corner. Tap to start.
 *
 * Live: the orb docks into a slim ink capsule centred at the bottom of the
 * screen that says who is listening and always shows the way out. The page
 * stays the star; the capsule is furniture.
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
  const state = vivid?.state ?? "idle";
  const isConnected = vivid?.isConnected ?? false;
  const startSession = vivid?.startSession;
  const endSession = vivid?.endSession ?? NOOP;
  const getAudioLevels = vivid?.getAudioLevels ?? NO_LEVELS;

  const isLive = state !== "idle" && state !== "error";

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
      <div className="fixed right-5 bottom-5 z-50 max-md:bottom-20">
        <SilkOrb
          state={state}
          onClick={start}
          size="md"
          getAudioLevels={getAudioLevels}
          label={vividCopy.talk}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 max-md:bottom-20">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink-950/90 py-1.5 pr-2 pl-1.5 shadow-[0_12px_40px_rgba(5,13,36,0.35)] backdrop-blur-xl">
        <SilkOrb
          state={state}
          size="xs"
          getAudioLevels={getAudioLevels}
          label={vividCopy.name}
        />

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
