import * as THREE from "three";

/**
 * The paper's fold model: an A4 sheet folded into a classic dart, as rigid
 * flat pieces.
 *
 * Sheet coordinates: x in [-0.5, 0.5], y in [-HALF_H, HALF_H], the nose at +y,
 * the printed front facing +z. Every piece keeps its polygon in those ORIGINAL
 * coordinates (so its UVs never change) plus a 2D affine that takes them to
 * the "current flat" coordinates after the flat folds.
 *
 * A flat fold clips every piece against its crease (Sutherland–Hodgman) and
 * reflects the moving side across it. Animated, a moving piece instead turns
 * about the crease by θ from 0 to π, and θ = π is exactly that reflection, so
 * the 3D pose and the flat bookkeeping always agree. The last two folds are
 * not flat: the sheet halves turn about the centre line into a V keel, and
 * the wings turn back out about x = ±KEEL, as a transform hierarchy
 * (half -> wing) on top of the flat folds.
 *
 * Everything here is built once; per frame only the angles change.
 */

export type Vec2 = readonly [number, number];
/** x' = a·x + c·y + e, y' = b·x + d·y + f */
type Affine = readonly [number, number, number, number, number, number];

export const HALF_W = 0.5;
export const HALF_H = Math.SQRT1_2;
/** Where the wings fold down, either side of the keel, after fold 2. */
export const KEEL = 0.095;
/** Lift per paper layer, in sheet units, so stacked layers never z-fight. */
export const LAYER_GAP = 0.0022;

/** The nose: the top centre of the sheet. */
const NOSE: Vec2 = [0, HALF_H];

type Crease = {
  /** A point on the crease, in flat coordinates at the time of the fold. */
  point: Vec2;
  /** Unit direction along the crease. */
  dir: Vec2;
  /** +1 or -1: the rotation sign that lifts the moving side toward +z. */
  lift: 1 | -1;
  /** Which side moves: the sign of cross(dir, v - point) for moving points. */
  moving: 1 | -1;
};

function crease(from: Vec2, to: Vec2, sample: Vec2): Crease {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const dir: Vec2 = [dx / len, dy / len];
  const side = cross(dir, [sample[0] - from[0], sample[1] - from[1]]) > 0 ? 1 : -1;
  return { point: from, dir, lift: side, moving: side };
}

/**
 * The four flat folds, in order. Stage 1: the top corners to the centre line.
 * Stage 2: the new slanted edges to the centre line again, 22.5° off it.
 * Each crease is written in the flat coordinates of the moment it is made.
 */
export const FLAT_FOLDS: readonly { stage: 1 | 2; crease: Crease }[] = [
  { stage: 1, crease: crease(NOSE, [0.5, HALF_H - 0.5], [0.5, HALF_H]) },
  { stage: 1, crease: crease(NOSE, [-0.5, HALF_H - 0.5], [-0.5, HALF_H]) },
  { stage: 2, crease: crease(NOSE, [0.5, -0.5], [0.5, 0]) },
  { stage: 2, crease: crease(NOSE, [-0.5, -0.5], [-0.5, 0]) },
];

export type Piece = {
  /** Polygon in original sheet coordinates, counter-clockwise, convex. */
  poly: Vec2[];
  /** Original -> flat coordinates after both flat stages. */
  affine: Affine;
  /** Indices into FLAT_FOLDS that moved this piece, oldest first. */
  folds: number[];
  /** Layer index after stage 0 (flat sheet), stage 1 and stage 2. */
  layers: [number, number, number];
  /** Which half of the plane it ends up in: +1 right, -1 left. */
  side: 1 | -1;
  /** Outside the keel strip, so it folds down as part of a wing. */
  wing: boolean;
};

const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];

function cross(a: Vec2, b: Vec2) {
  return a[0] * b[1] - a[1] * b[0];
}

function apply(m: Affine, v: Vec2): Vec2 {
  return [m[0] * v[0] + m[2] * v[1] + m[4], m[1] * v[0] + m[3] * v[1] + m[5]];
}

/** a ∘ b: apply b first, then a. */
function compose(a: Affine, b: Affine): Affine {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function invert(m: Affine): Affine {
  const det = m[0] * m[3] - m[2] * m[1];
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}

function reflection(c: Crease): Affine {
  const [ux, uy] = c.dir;
  const a = 2 * ux * ux - 1;
  const b = 2 * ux * uy;
  const d = 2 * uy * uy - 1;
  const [px, py] = c.point;
  return [a, b, b, d, px - (a * px + b * py), py - (b * px + d * py)];
}

function area(poly: Vec2[]) {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

/** Sutherland–Hodgman against one half-plane: keeps the points where f >= 0. */
function clip(poly: Vec2[], f: (v: Vec2) => number): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  // Points that sit exactly on the line can be emitted twice.
  return out.filter((v, i) => {
    const prev = out[(i + out.length - 1) % out.length];
    return out.length < 2 || Math.hypot(v[0] - prev[0], v[1] - prev[1]) > 1e-7;
  });
}

const MIN_AREA = 1e-6;

type Work = Omit<Piece, "side" | "wing"> & { layer: number };

/**
 * Splits one piece by a half-plane given in FLAT coordinates. Returns the part
 * where f >= 0 and the part where f < 0, each mapped back to original
 * coordinates (empty or sliver parts are dropped).
 */
function split(piece: Work, f: (v: Vec2) => number): [Vec2[] | null, Vec2[] | null] {
  const flat = piece.poly.map((v) => apply(piece.affine, v));
  const back = invert(piece.affine);
  const keep = clip(flat, f);
  const rest = clip(flat, (v) => -f(v));
  const toOrig = (poly: Vec2[]) =>
    Math.abs(area(poly)) > MIN_AREA ? poly.map((v) => apply(back, v)) : null;
  return [toOrig(keep), toOrig(rest)];
}

/** Builds the folded pieces once. Pure: same input, same pieces. */
export function buildPieces(): Piece[] {
  let pieces: Work[] = [
    {
      poly: [
        [-HALF_W, -HALF_H],
        [HALF_W, -HALF_H],
        [HALF_W, HALF_H],
        [-HALF_W, HALF_H],
      ],
      affine: IDENTITY,
      folds: [],
      layers: [0, 0, 0],
      layer: 0,
    },
  ];

  let stage = 1;
  // The stack height when the stage starts. The left and right folds of one
  // stage never overlap, so both land on the same layers.
  let top = 0;
  for (let index = 0; index < FLAT_FOLDS.length; index++) {
    const fold = FLAT_FOLDS[index];
    if (fold.stage !== stage) {
      for (const p of pieces) p.layers[stage] = p.layer;
      stage = fold.stage;
      top = Math.max(...pieces.map((p) => p.layer));
    }
    const { crease: c } = fold;
    const side = (v: Vec2) =>
      c.moving * cross(c.dir, [v[0] - c.point[0], v[1] - c.point[1]]);
    const mirror = reflection(c);

    const next: Work[] = [];
    for (const piece of pieces) {
      const [moving, staying] = split(piece, side);
      if (staying) next.push({ ...piece, poly: staying, layers: [...piece.layers] });
      if (moving) {
        // A folded stack lands upside down on top of everything.
        next.push({
          poly: moving,
          affine: compose(mirror, piece.affine),
          folds: [...piece.folds, index],
          layers: [...piece.layers],
          layer: 2 * top + 1 - piece.layer,
        });
      }
    }
    pieces = next;
  }
  for (const p of pieces) p.layers[stage] = p.layer;

  // The 3D folds: split into halves along x = 0, then keel and wing at ±KEEL.
  const out: Piece[] = [];
  for (const piece of pieces) {
    const [right, left] = split(piece, (v) => v[0]);
    for (const [poly, s] of [
      [right, 1],
      [left, -1],
    ] as const) {
      if (!poly) continue;
      const half: Work = { ...piece, poly };
      const [wing, keel] = split(half, (v) => s * v[0] - KEEL);
      if (wing) out.push(finish(half, wing, s, true));
      if (keel) out.push(finish(half, keel, s, false));
    }
  }
  return out;
}

function finish(base: Work, poly: Vec2[], side: 1 | -1, wing: boolean): Piece {
  // Keep every polygon counter-clockwise in original coordinates, so the
  // triangle winding (and so the front face) is the same for all of them.
  const ccw = area(poly) < 0 ? [...poly].reverse() : poly;
  return {
    poly: ccw,
    affine: base.affine,
    folds: base.folds,
    layers: base.layers,
    side,
    wing,
  };
}

/** The fold angles at one moment. */
export type FoldPose = {
  /** Stage 1 (corners to the centre), 0..π. */
  corners: number;
  /** Stage 2 (edges to the centre), 0..π. */
  edges: number;
  /** Each half's turn about the centre line, 0 (flat) .. ~80°. */
  half: number;
  /** Each wing's turn back out about x = ±KEEL, relative to its half. */
  wing: number;
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const tmpAxis = new THREE.Vector3();
const tmpA = new THREE.Matrix4();
const tmpB = new THREE.Matrix4();

/** Rotation by `angle` about an axis through `point`, written into `out`. */
function rotateAbout(
  out: THREE.Matrix4,
  axis: THREE.Vector3,
  angle: number,
  px: number,
  py: number,
) {
  out.makeTranslation(px, py, 0);
  out.multiply(tmpA.makeRotationAxis(axis, angle));
  return out.multiply(tmpB.makeTranslation(-px, -py, 0));
}

/**
 * Per-frame matrices for the four flat folds and the two 3D hinges. Built
 * once per pose and shared by every piece.
 */
export class FoldRig {
  private readonly flat = FLAT_FOLDS.map(() => new THREE.Matrix4());
  private readonly halves = { 1: new THREE.Matrix4(), [-1]: new THREE.Matrix4() };
  private readonly wings = { 1: new THREE.Matrix4(), [-1]: new THREE.Matrix4() };
  private stage = 0;

  setPose(pose: FoldPose) {
    FLAT_FOLDS.forEach(({ stage, crease: c }, i) => {
      const angle = (stage === 1 ? pose.corners : pose.edges) * c.lift;
      tmpAxis.set(c.dir[0], c.dir[1], 0);
      rotateAbout(this.flat[i], tmpAxis, angle, c.point[0], c.point[1]);
    });
    this.stage = pose.edges > 0 ? 2 : pose.corners > 0 ? 1 : 0;
    // Right half: +x turns toward +z (the printed side, which ends up inside).
    rotateAbout(this.halves[1], Y_AXIS, -pose.half, 0, 0);
    rotateAbout(this.halves[-1], Y_AXIS, pose.half, 0, 0);
    // Right wing: +x turns toward -z, back out from the closed half.
    rotateAbout(this.wings[1], Y_AXIS, pose.wing, KEEL, 0);
    rotateAbout(this.wings[-1], Y_AXIS, -pose.wing, -KEEL, 0);
  }

  /** The piece's matrix in the paper's local frame. */
  matrixFor(piece: Piece, out: THREE.Matrix4) {
    out.copy(this.halves[piece.side]);
    if (piece.wing) out.multiply(this.wings[piece.side]);
    out.multiply(tmpA.makeTranslation(0, 0, piece.layers[this.stage] * LAYER_GAP));
    for (let i = piece.folds.length - 1; i >= 0; i--) {
      out.multiply(this.flat[piece.folds[i]]);
    }
    return out;
  }
}

/**
 * Flat triangles for a piece: positions in sheet coordinates, sheet UVs, and
 * what the paper's fold shading needs to know about each vertex:
 *
 * - `aFlat`: where it lies after the flat folds (its distance from the centre
 *   line is what decides how deep in the keel or how close to a wing root it
 *   is),
 * - `aFlip`: +1 if the piece's printed face still points to flat +z, -1 if an
 *   odd number of folds turned it over,
 * - `aWing`: 1 for a wing piece, 0 for the keel.
 */
export function pieceGeometry(piece: Piece) {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const flat: number[] = [];
  const flip = piece.folds.length % 2 === 0 ? 1 : -1;
  for (const [x, y] of piece.poly) {
    positions.push(x, y, 0);
    uvs.push(x + HALF_W, (y + HALF_H) / (2 * HALF_H));
    flat.push(...apply(piece.affine, [x, y]));
  }
  geometry.setAttribute("aFlat", new THREE.Float32BufferAttribute(flat, 2));
  geometry.setAttribute(
    "aFlip",
    new THREE.Float32BufferAttribute(
      piece.poly.map(() => flip),
      1,
    ),
  );
  geometry.setAttribute(
    "aWing",
    new THREE.Float32BufferAttribute(
      piece.poly.map(() => (piece.wing ? 1 : 0)),
      1,
    ),
  );
  const index: number[] = [];
  for (let i = 1; i < piece.poly.length - 1; i++) index.push(0, i, i + 1);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(
      piece.poly.flatMap(() => [0, 0, 1]),
      3,
    ),
  );
  geometry.setIndex(index);
  return geometry;
}
