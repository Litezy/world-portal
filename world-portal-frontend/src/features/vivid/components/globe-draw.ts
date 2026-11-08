/**
 * Vivid's globe, as numbers: where every dot sits and how it's lit. Ported
 * from the WorldStreet hub (components/vivid/globe-draw.ts) so Vivid wears the
 * same mark on E-Embassy as everywhere else in WorldStreet.
 *
 * The dots sit on a Fibonacci sphere (an even spread with no seams and no
 * crowded poles), turn on an axis tipped toward you and are drawn front half
 * only, so they shrink, fade and crowd toward the rim the way a real globe
 * foreshortens. No imports and no DOM.
 */

const TAU = Math.PI * 2;
/** The axis leans toward you, so the top cap shows. */
const TILT = 0.38;
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Where the turn starts, so a still frame shows a pleasant face. */
export const FIRST_TURN = 0.13;

/**
 * Rim to front: WorldStreet gold (#EAB308, `--ee-gold`) warming to pale gold
 * where a dot faces you. A canvas can't read a class, so the brand gold is
 * spelled out here, once.
 *
 * E-Embassy's change: the hub warms to near-white (#FEF3C7) over its stone.
 * Over E-Embassy's night blue that front read as a grey-blue ball at 1x, so
 * the front stops at a pale gold (#FDE68A) and the globe reads gold all over.
 */
const RIM = [234, 179, 8];
const FRONT = [253, 230, 138];
const SHADES = Array.from({ length: 32 }, (_, i) => {
  const c = RIM.map((v, k) => Math.round(v + ((FRONT[k] - v) * i) / 31));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
});

/** How many dots make a globe about `across` dots wide at its face. */
export function dotsFor(across: number) {
  return Math.round(Math.PI * across * across);
}

/** `n` points spread evenly over a unit sphere: x, y, z for each in turn. */
export function globePoints(n: number) {
  const pts = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = GOLDEN * i;
    pts[i * 3] = Math.cos(a) * r;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = Math.sin(a) * r;
  }
  return pts;
}

export type GlobeFrame = {
  /** The globe's centre and radius. */
  cx: number;
  cy: number;
  radius: number;
  /** A dot's radius where it faces you; dots shrink toward the rim. */
  dot: number;
  /** How far round it has turned: 0 to 1 is one turn. */
  turn: number;
  /** Voice, 0 to 1: every dot swells and brightens, and the globe grows a touch. */
  level?: number;
};

/** The globe on a 2D canvas, in the context's current transform. */
export function drawGlobe(
  ctx: CanvasRenderingContext2D,
  pts: Float32Array,
  f: GlobeFrame,
) {
  const level = f.level ?? 0;
  const a = f.turn * TAU;
  const cosA = Math.cos(a);
  const sinA = Math.sin(a);
  const radius = f.radius * (1 + level * 0.05);
  for (let i = 0; i < pts.length; i += 3) {
    const x = pts[i];
    const y = pts[i + 1];
    const z = pts[i + 2];
    const x1 = x * cosA + z * sinA;
    const z1 = z * cosA - x * sinA;
    const y2 = y * COS_T - z1 * SIN_T;
    // Depth: 1 faces you, 0 is the rim. The far half isn't drawn.
    const d = y * SIN_T + z1 * COS_T;
    if (d <= 0) continue;
    ctx.globalAlpha = Math.min(1, 0.18 + 0.82 * d ** 0.7 + level * 0.3);
    ctx.fillStyle =
      SHADES[Math.min(31, Math.round(Math.min(1, d * d + level * 0.4) * 31))];
    ctx.beginPath();
    ctx.arc(
      f.cx + x1 * radius,
      f.cy - y2 * radius,
      f.dot * (0.45 + 0.55 * Math.sqrt(d)) * (1 + level * 0.8),
      0,
      TAU,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
