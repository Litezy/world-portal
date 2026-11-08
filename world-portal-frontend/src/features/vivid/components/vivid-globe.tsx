"use client";

/**
 * VividGlobe: Vivid's mark, the same one WorldStreet's hub wears. A globe of
 * gold dots, turning slowly (the dots and their light: globe-draw.ts).
 *
 * Ported from the hub (components/vivid/VividGlobe.tsx). The dot count follows
 * the size, so every size reads as the same object. In a voice session the
 * globe turns faster and its dots swell with the voice. One 2D canvas, no
 * WebGL. It stops drawing off-screen and in a hidden tab, and holds one still
 * frame under prefers-reduced-motion.
 *
 * E-Embassy's change: the hub floats its globe on a stone disc. Here the disc
 * is E-Embassy's night blue (the hero's `brand-950`), drawn in CSS so it is
 * there from the first paint and reads the same on the light and dark themes:
 * a gold globe on a navy coin. The globe sits a little inside the coin.
 */

import { type CSSProperties, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { dotsFor, drawGlobe, FIRST_TURN, globePoints } from "./globe-draw";

/** Milliseconds per turn. Idle drifts; a live session hurries. */
const TURN_IDLE = 26_000;
const TURN_ACTIVE = 9_000;
/** How much of the coin the globe fills. */
const DISC_INSET = 0.88;

export function VividGlobe({
  size,
  active = false,
  getAudioLevels,
  still = false,
  backdrop = false,
  className,
  style,
}: {
  /** Width and height in px. */
  size: number;
  /** A live voice session: the globe turns faster. */
  active?: boolean;
  /** The voice's frequency bins (0 to 255); the dots swell on them while active. */
  getAudioLevels?: () => Uint8Array;
  /** Hold the current frame: for a mark that is hidden or only moves on cue. */
  still?: boolean;
  /** The night-blue coin behind the dots, for a globe on a light surface. */
  backdrop?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  // The loop reads these through refs, so a change never restarts it and the
  // globe never jumps.
  const activeRef = useRef(active);
  const levelsRef = useRef(getAudioLevels);
  const stillRef = useRef(still);
  const loop = useRef<{ run: () => void; halt: () => void } | null>(null);
  useEffect(() => {
    activeRef.current = active;
    levelsRef.current = getAudioLevels;
    stillRef.current = still;
  });

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // On the coin the globe is drawn as a smaller one, dots and all.
    const inner = backdrop ? size * DISC_INSET : size;
    // Dots across the face: about 10 at 40px, 13 at 60px. Bigger globes get
    // fewer, bolder dots than a fixed pitch would give, as a mark should.
    const across = Math.min(18, Math.max(7, 6 + inner * 0.12));
    const pts = globePoints(dotsFor(across));
    const half = size / 2;
    const dot = (inner / across) * (inner < 32 ? 0.3 : 0.27);
    // Room at the rim for a dot at full swell.
    const radius = inner / 2 - dot * 1.4 - 0.5;

    let turn = FIRST_TURN;
    let level = 0;
    let raf = 0;
    let last = 0;
    let onScreen = true;

    function sample() {
      const bins = levelsRef.current?.();
      if (!bins || bins.length === 0) return 0;
      let sum = 0;
      for (let i = 0; i < bins.length; i++) sum += bins[i];
      return sum / bins.length / 255;
    }

    function draw() {
      ctx!.clearRect(0, 0, size, size);
      drawGlobe(ctx!, pts, { cx: half, cy: half, radius, dot, turn, level });
    }

    function frame(t: number) {
      const dt = last ? Math.min(t - last, 100) : 16; // a backgrounded tab must not lurch
      last = t;
      // Turn accumulates, so a speed change bends the motion instead of jumping it.
      turn = (turn + dt / (activeRef.current ? TURN_ACTIVE : TURN_IDLE)) % 1;
      const target = activeRef.current ? sample() : 0;
      level += (target - level) * 0.12; // breathe, don't strobe
      draw();
      raf = requestAnimationFrame(frame);
    }

    function run() {
      if (raf || reduced || stillRef.current || !onScreen || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function halt() {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    loop.current = { run, halt };

    draw();
    canvas.dataset.drawn = "";

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) run();
      else halt();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? halt() : run());
    document.addEventListener("visibilitychange", onVisibility);
    run();

    return () => {
      halt();
      loop.current = null;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [size, backdrop]);

  useEffect(() => {
    if (still) loop.current?.halt();
    else loop.current?.run();
  }, [still]);

  const canvas = (
    <canvas
      ref={ref}
      aria-hidden="true"
      // Fades in on its first frame rather than popping in after hydration.
      className={cn(
        "block shrink-0 opacity-0 transition-opacity duration-500 data-drawn:opacity-100 motion-reduce:transition-none",
        !backdrop && className,
      )}
      style={{ width: size, height: size, ...(backdrop ? null : style) }}
    />
  );

  if (!backdrop) return canvas;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full",
        // Night blue, lifted a touch toward the top so the coin has a body.
        "bg-[radial-gradient(circle_at_50%_30%,var(--brand-900),var(--brand-950)_68%)]",
        // A hairline of light at the edge: crisp on white, and still a rim on dark.
        "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),inset_0_1px_0_rgb(255_255_255/0.12)]",
        className,
      )}
      style={{ width: size, height: size, ...style }}
    >
      {canvas}
    </span>
  );
}
