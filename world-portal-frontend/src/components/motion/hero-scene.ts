import type { FoldPose } from "@/components/motion/hero-paper-folds";

/**
 * "Cleared for take-off": the hero's one shared clock.
 *
 * Everything in the pinned hero is a pure function of one scroll progress p
 * (0 at the top, 1 when the sticky panel releases): the DOM planes here, and
 * the paper in `hero-paper.tsx`. Pure functions are what make the sequence
 * fully reversible: scrolling back up is just smaller p.
 *
 *   0.00–0.43  the folds (corners, edges, half, wings)
 *   0.43–0.53  the plane noses round toward the horizon
 *   0.53–0.86  the launch, into depth and into the cloud (the peak)
 *   0.86–1.00  the clouds part over the lagoon; the plane glides down
 */

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Smoothstep from a to b. */
export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Linear 0..1 across a..b. */
export function span(a: number, b: number, x: number) {
  return clamp01((x - a) / (b - a));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A paper fold: slow to lift, quick through the middle, soft to land. */
export function foldEase(t: number) {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

const DEG = Math.PI / 180;

export const TIMELINE = {
  corners: [0.03, 0.135],
  edges: [0.155, 0.255],
  half: [0.275, 0.385],
  wing: [0.325, 0.43],
  turn: [0.43, 0.53],
  launch: [0.53, 0.86],
  arrive: [0.86, 1],
} as const;

/** The finished dart: keel halves ~80° up, wings back out to ~7° dihedral. */
export const HALF_ANGLE = 80 * DEG;
export const WING_ANGLE = 73 * DEG;

export function foldPose(p: number): FoldPose {
  const t = TIMELINE;
  return {
    corners: Math.PI * foldEase(span(t.corners[0], t.corners[1], p)),
    edges: Math.PI * foldEase(span(t.edges[0], t.edges[1], p)),
    half: HALF_ANGLE * foldEase(span(t.half[0], t.half[1], p)),
    wing: WING_ANGLE * foldEase(span(t.wing[0], t.wing[1], p)),
  };
}

/** The layout family the scene is choreographed for. */
export type SceneMode = "wide" | "compact";

export type SceneElements = {
  sky?: HTMLElement | null;
  lagoon?: HTMLElement | null;
  farA?: HTMLElement | null;
  farB?: HTMLElement | null;
  nearA?: HTMLElement | null;
  nearB?: HTMLElement | null;
  copy?: HTMLElement | null;
  card?: HTMLElement | null;
  scrim?: HTMLElement | null;
  fallback?: HTMLElement | null;
};

function set(el: HTMLElement | null | undefined, transform: string, opacity: number) {
  if (!el) return;
  el.style.transform = transform;
  el.style.opacity = opacity.toFixed(3);
}

/** Opacity for content: hidden from pointer and keyboard once it has faded. */
function setContent(
  el: HTMLElement | null | undefined,
  transform: string,
  opacity: number,
) {
  if (!el) return;
  set(el, transform, opacity);
  el.style.visibility = opacity < 0.02 ? "hidden" : "visible";
}

/**
 * Writes every DOM plane's transform and opacity for progress p. Only
 * transform and opacity change, so each plane stays on the compositor.
 *
 * Rates, back to front: the sky barely moves, the far cloud band rises and
 * swells as the camera sinks into it, and the near wisps cross the frame in
 * a fraction of the scroll, in front of the paper.
 */
export function applyScene(els: SceneElements, p: number, mode: SceneMode) {
  const wide = mode === "wide";

  // L0: the sky, slowest. A slight sink and swell, never past ~1.07×.
  const drift = smooth(0, 0.86, p);
  set(
    els.sky,
    `translate3d(0, ${(-2.6 * drift).toFixed(2)}%, 0) scale(${(1.01 + 0.06 * drift).toFixed(4)})`,
    1,
  );

  // L5: the lagoon, under the cloud deck, settling from a slight zoom.
  const land = smooth(0.79, 0.9, p);
  const settle = smooth(0.8, 1, p);
  set(els.lagoon, `scale(${(1.13 - 0.13 * settle).toFixed(4)})`, land);

  // L1: the far cloud band. Slow at first, then it rises to fill the frame
  // (the camera sinking into the deck), then parts outward along its gap.
  const rise = smooth(0.42, 0.84, p);
  const lift = wide ? 64 : 58;
  const ty = lift * (1 - rise) - 4 * smooth(0, 0.42, p) * (1 - rise);
  const swell = 1 + 0.06 * smooth(0, 0.42, p) + 0.3 * rise;
  const part = smooth(0.845, 0.975, p);
  const gone = 1 - smooth(0.9, 0.985, p);
  set(
    els.farA,
    `translate3d(${(-34 * part).toFixed(2)}%, ${(ty - 22 * part).toFixed(2)}%, 0) scale(${(swell * (1 + 0.55 * part)).toFixed(4)})`,
    gone,
  );
  set(
    els.farB,
    `translate3d(${(32 * part).toFixed(2)}%, ${(ty + 24 * part).toFixed(2)}%, 0) scale(${(swell * (1 + 0.55 * part)).toFixed(4)})`,
    gone,
  );

  // L4: near wisps, fastest. One crosses in front of the plane early in the
  // launch; the bank swallows it as it flies into the cloud.
  const qa = span(0.55, 0.8, p);
  set(
    els.nearA,
    `translate3d(${(48 - 125 * qa).toFixed(2)}%, ${(8 - 18 * qa).toFixed(2)}%, 0) scale(${(1.35 + 0.9 * qa).toFixed(4)})`,
    0.72 * smooth(0.55, 0.62, p) * (1 - smooth(0.72, 0.8, p)),
  );
  const qb = span(0.68, 0.93, p);
  set(
    els.nearB,
    `translate3d(${(52 - 105 * qb).toFixed(2)}%, ${(26 - 46 * qb).toFixed(2)}%, 0) scale(${(1.05 + 2.1 * qb).toFixed(4)})`,
    (wide ? 0.7 : 0.45) * smooth(0.68, 0.76, p) * (1 - smooth(0.85, 0.93, p)),
  );

  // L2: the copy eases back and up for the flight, and (wide layouts)
  // returns over the lagoon for the arrival.
  if (wide) {
    const away = smooth(0.54, 0.68, p);
    const back = smooth(0.885, 0.985, p);
    const out = away * (1 - back);
    const shown = 1 - away + away * back;
    setContent(
      els.copy,
      `translate3d(0, ${(-30 * out + 14 * back * (1 - back)).toFixed(2)}px, 0) scale(${(1 - 0.035 * out).toFixed(4)})`,
      shown,
    );
    // The scrim under the copy comes and goes with it.
    set(els.scrim, "none", shown);
    const awayCard = smooth(0.56, 0.7, p);
    const backCard = smooth(0.9, 1, p);
    const outCard = awayCard * (1 - backCard);
    setContent(
      els.card,
      `translate3d(0, ${(18 * outCard).toFixed(2)}px, 0)`,
      1 - awayCard + awayCard * backCard,
    );
  } else {
    // Phones and tablets: the paper launches up through where the copy is,
    // so the copy clears first, and the arrival belongs to the card.
    const away = smooth(0.44, 0.56, p);
    setContent(
      els.copy,
      `translate3d(0, ${(-24 * away).toFixed(2)}px, 0) scale(${(1 - 0.03 * away).toFixed(4)})`,
      1 - away,
    );
    // The scrim leaves with the copy; the card that returns is its own glass.
    set(els.scrim, "none", 1 - away);
    const back = smooth(0.88, 0.985, p);
    setContent(els.card, `translate3d(0, ${(22 * (1 - back)).toFixed(2)}px, 0)`, back);
  }

  // Without WebGL, the still plane flies a simple 2D version of the path.
  if (els.fallback) {
    const go = smooth(0.53, 0.84, p);
    set(
      els.fallback,
      `translate3d(${(-30 * go).toFixed(2)}%, ${(-55 * go).toFixed(2)}%, 0) scale(${(1 - 0.78 * go).toFixed(4)})`,
      1 - smooth(0.74, 0.84, p),
    );
  }
}
