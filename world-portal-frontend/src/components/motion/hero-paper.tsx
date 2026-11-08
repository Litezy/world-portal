"use client";

import * as React from "react";

import * as THREE from "three";

import {
  buildPieces,
  FoldRig,
  HALF_H,
  KEEL,
  pieceGeometry,
} from "@/components/motion/hero-paper-folds";
import {
  drawPaper,
  loadPaperFonts,
  type PaperCanvases,
  readPaperFonts,
  STAMP,
  STAMP_SHEET,
} from "@/components/motion/hero-paper-texture";
import {
  clamp01,
  foldPose,
  HALF_ANGLE,
  lerp,
  smooth,
  span,
  TIMELINE,
  WING_ANGLE,
} from "@/components/motion/hero-scene";

/** What the hero calls once per frame, with the shared scroll progress. */
export type HeroPaperApi = { render: (p: number, now: number) => void };

const DEG = Math.PI / 180;
const FOV = 35;
const TAN = Math.tan((FOV / 2) * DEG);
/** Camera distance from the plane the paper rests in (z = 0). */
const CAMERA_Z = 5;

/**
 * `hero/lagoon-day.jpg`, in its own pixels: its size, where the glide ends
 * (open water inside the villas' arc, so the plane lands beside the villas
 * rather than on a roof, clear of the copy, and on water dark enough for
 * white paper to read), and the horizontal object-position the hero gives it
 * (centred from lg, 72% below, where the crop shows less of the arc).
 */
const LAGOON = {
  w: 2752,
  h: 1536,
  glide: { wide: { x: 2400, y: 840 }, compact: { x: 2050, y: 760 } },
  focus: { wide: 0.5, compact: 0.72 },
};

/** Where the tail of the folded plane is, in sheet coordinates. */
const TAIL = new THREE.Vector3(0, -HALF_H + 0.03, 0.05);
/** The finished plane's middle, which the flight path carries. */
const BODY = new THREE.Vector3(0, -0.06, 0.06);

const CONTRAIL_SAMPLES = 220;
/** A condensation trail in sunlight: white at the core, sky-cyan at the edges. */
const CONTRAIL = "#ffffff";
const CONTRAIL_EDGE = "#8fd6ff";

/**
 * The light of the photographs: late morning, the sun high and out of frame
 * to the upper left, a bright blue sky overhead, white cloud and sea below.
 */
const SUN = "#fff5e8";
const SKY = "#d3e5fb";
const BOUNCE = "#b4c4d8";
/** Aerial perspective toward the horizon, and the inside of a cloud. */
const HAZE_SKY = "#d6e6f7";
const HAZE_CLOUD = "#f3f7fb";

type FoldShade = { uHalf: { value: number }; uWing: { value: number } };

/**
 * Soft shading between the folds, which a flat-shaded sheet has no other way
 * to get: the inside of the keel's V, both faces of the concave corner under
 * each wing root, and a seam along the slot between the wings. Written into
 * the material's albedo, so it darkens sun and sky light alike, and scaled by
 * how far the keel and wings have folded, so the flat form has none.
 */
function shadeFolds(
  material: THREE.MeshStandardMaterial,
  side: 1 | -1,
  fold: FoldShade,
) {
  const keel = KEEL.toFixed(4);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHalf = fold.uHalf;
    shader.uniforms.uWing = fold.uWing;
    shader.uniforms.uSide = { value: side };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        attribute vec2 aFlat;
        attribute float aFlip;
        attribute float aWing;
        varying vec2 vFlat;
        varying float vFlip;
        varying float vWing;`,
      )
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `#include <begin_vertex>
        vFlat = aFlat;
        vFlip = aFlip;
        vWing = aWing;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        uniform float uHalf;
        uniform float uWing;
        uniform float uSide;
        varying vec2 vFlat;
        varying float vFlip;
        varying float vWing;`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `#include <map_fragment>
        {
          float ax = abs(vFlat.x);
          // 1 on the face that ends up inside the keel and on top of the wings.
          float up = step(0.0, vFlip * uSide);
          float keel = 1.0 - vWing;
          float root = 1.0 - smoothstep(0.0, 0.17, ax - ${keel});
          float occ = 0.0;
          occ += keel * up * uHalf * (0.22 + 0.4 * (1.0 - ax / ${keel}));
          occ += keel * (1.0 - up) * uWing * 0.3 * smoothstep(0.0, ${keel}, ax);
          occ += vWing * (1.0 - up) * uWing * 0.36 * root;
          occ += vWing * up * uHalf * (1.0 - uWing) * 0.3 * (1.0 - smoothstep(0.0, 0.5, ax));
          occ += vWing * up * uWing * 0.14 * (1.0 - smoothstep(0.0, 0.04, ax - ${keel}));
          diffuseColor.rgb *= 1.0 - min(occ, 0.6);
        }`,
      );
  };
}

/** Orientation from a nose direction and the printed side's normal. */
function basis(nose: THREE.Vector3, normal: THREE.Vector3) {
  const y = nose.clone().normalize();
  const x = new THREE.Vector3().crossVectors(y, normal).normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(x, y, z),
  );
}

/** Nose into the screen, printed side (the wing tops) up. */
const LEVEL = basis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const AZ = new THREE.Vector3(0, 0, 1);
const qa = new THREE.Quaternion();

type Flight = { tilt: number; yaw: number; pitch: number; roll: number };

/**
 * A flying attitude: heading (yaw, + is right), pitch (+ is nose up), bank
 * (+ is right wing down), and a presentation tilt toward the camera so the
 * wing tops stay readable from an eye level the plane is above.
 */
function attitude(f: Flight, out = new THREE.Quaternion()) {
  out.setFromAxisAngle(AX, f.tilt);
  out.multiply(qa.setFromAxisAngle(AY, -f.yaw));
  out.multiply(qa.setFromAxisAngle(AX, f.pitch));
  out.multiply(qa.setFromAxisAngle(AZ, -f.roll));
  return out.multiply(LEVEL);
}

/** The form, upright, its face turned toward the copy at three-quarters. */
const K_FORM = basis(
  new THREE.Vector3(-0.05, 0.995, -0.1),
  new THREE.Vector3(-0.6, 0.06, 0.8),
);
/** Mid-folds: tipped back a little more so the flaps read as they land. */
const K_FOLDING = basis(
  new THREE.Vector3(0.02, 0.95, -0.3),
  new THREE.Vector3(-0.55, 0.26, 0.8),
);
/** The finished dart, presented nose-left and wing tops toward the camera. */
const F_PRESENT: Flight = {
  tilt: 24 * DEG,
  yaw: -122 * DEG,
  pitch: -4 * DEG,
  roll: -6 * DEG,
};
const K_PRESENT = attitude(F_PRESENT);

/**
 * How hard the plane banks into a turn: radians of bank per radian of heading
 * change across ±0.012 of progress (so the bank always matches the path).
 */
const BANK_GAIN = 3.85;
const BANK_MAX = 32 * DEG;

/** A cubic-bezier ease (CSS semantics), solved for x by Newton steps. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
  const b = (a1: number, a2: number) => 3 * a2 - 6 * a1;
  const c = (a1: number) => 3 * a1;
  const at = (t: number, a1: number, a2: number) =>
    ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
  const slope = (t: number, a1: number, a2: number) =>
    3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1);
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t -= (at(t, x1, x2) - x) / s;
    }
    return at(clamp01(t), y1, y2);
  };
}

/** The launch: a held breath, a hard push, a long glide in. */
const flightEase = bezier(0.5, 0, 0.32, 1);

type Layout = {
  wide: boolean;
  aspect: number;
  /** Where the paper rests, and its size. */
  rest: THREE.Vector3;
  scale: number;
  curve: THREE.CatmullRomCurve3;
  /** The attitude the turn ends on: pointing down the start of the path. */
  launch: Flight;
};

function ndc(nx: number, ny: number, z: number, aspect: number) {
  const half = (CAMERA_Z - z) * TAN;
  return new THREE.Vector3(nx * half * aspect, ny * half, z);
}

function headingOf(t: THREE.Vector3) {
  return {
    yaw: Math.atan2(t.x, -t.z),
    pitch: Math.asin(THREE.MathUtils.clamp(t.y, -1, 1)),
  };
}

const NOSE_UP = 7 * DEG;
const FLIGHT_TILT = 16 * DEG;
const ARRIVAL_TILT = 34 * DEG;
const ARRIVAL_GROW = 2;

/**
 * The paper and its flight, rendered into one transparent canvas over the
 * hero. Mounted on idle by the hero, which also owns the frame loop: every
 * frame it hands this the shared progress, so the canvas and the DOM planes
 * can never drift apart.
 */
export function HeroPaper({
  apiRef,
  slotRef,
  onReady,
  onFail,
  ready: shown = false,
  className,
}: {
  apiRef: React.RefObject<HeroPaperApi | null>;
  slotRef: React.RefObject<HTMLElement | null>;
  onReady: () => void;
  onFail: () => void;
  /** Set by the hero once the first frame is drawn; the canvas fades in. */
  ready?: boolean;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  // Callbacks change identity with the parent's renders; the scene is built once.
  const ready = React.useRef(onReady);
  const fail = React.useRef(onFail);
  React.useEffect(() => {
    ready.current = onReady;
    fail.current = onFail;
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "default",
      });
    } catch {
      fail.current();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    let disposed = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 90);
    camera.position.set(0, 0, CAMERA_Z);

    // Light, matched to the plates: a warm-white sun from the upper left and
    // in front, the blue sky overhead, white cloud and sea bouncing light up
    // from below, and the bright sky behind it rimming the far edges.
    const hemi = new THREE.HemisphereLight(SKY, BOUNCE, 1.45);
    const key = new THREE.DirectionalLight(SUN, 2.75);
    key.position.set(-2.8, 3.6, 3.2);
    const rim = new THREE.DirectionalLight(SKY, 0.55);
    rim.position.set(3.2, 0.8, -3.4);
    scene.add(hemi, key, rim);

    const hazeSky = new THREE.Color(HAZE_SKY);
    const hazeCloud = new THREE.Color(HAZE_CLOUD);
    scene.fog = new THREE.Fog(hazeSky.clone(), 0, 1e6);
    const foldShade: FoldShade = { uHalf: { value: 0 }, uWing: { value: 0 } };

    // The paper: one group (the paper's local frame), one pair of meshes per
    // rigid piece (front face printed, back face plain).
    const paper = new THREE.Group();
    paper.matrixAutoUpdate = false;
    scene.add(paper);

    const pieces = buildPieces();
    const rig = new FoldRig();
    const meshes: {
      piece: (typeof pieces)[number];
      front: THREE.Mesh;
      back: THREE.Mesh;
    }[] = [];
    const disposables: { dispose: () => void }[] = [];

    let canvases: PaperCanvases | null = null;
    let frontTex: THREE.CanvasTexture | null = null;
    let decal: THREE.Mesh | null = null;
    let layout: Layout | null = null;
    let readyAt = -1;
    let stampAt = -1;
    let baked = false;

    // Contrail: a camera-facing ribbon along the tail's path, widening with
    // age, and hazing toward the sky the further away it is.
    const trailUniforms = {
      uHead: { value: 0 },
      uWidth: { value: 0.016 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(CONTRAIL) },
      uEdge: { value: new THREE.Color(CONTRAIL_EDGE) },
      uHaze: { value: new THREE.Color(HAZE_SKY) },
    };
    const trail = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.ShaderMaterial({
        uniforms: trailUniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          attribute vec3 aSideVec;
          attribute float aPhase;
          attribute float aSide;
          uniform float uHead;
          uniform float uWidth;
          varying float vPhase;
          varying float vSide;
          varying float vDepth;
          void main() {
            vPhase = aPhase;
            vSide = aSide;
            float age = clamp((uHead - aPhase) / 0.09, 0.0, 1.0);
            float hw = uWidth * (0.3 + 1.7 * age);
            vec3 p = position + aSideVec * aSide * hw;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uHead;
          uniform float uOpacity;
          uniform vec3 uColor;
          uniform vec3 uEdge;
          uniform vec3 uHaze;
          varying float vPhase;
          varying float vSide;
          varying float vDepth;
          void main() {
            float age = uHead - vPhase;
            if (age < 0.0) discard;
            float head = smoothstep(0.0, 0.01, age);
            float tail = 1.0 - smoothstep(0.025, 0.09, age);
            float edge = 1.0 - vSide * vSide;
            float haze = 0.6 * smoothstep(6.0, 26.0, vDepth);
            vec3 color = mix(mix(uEdge, uColor, smoothstep(0.15, 0.85, edge)), uHaze, haze);
            gl_FragColor = vec4(color, head * tail * edge * uOpacity * (1.0 - 0.4 * haze));
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    trail.frustumCulled = false;
    trail.renderOrder = 2;
    scene.add(trail);

    // --- Poses ------------------------------------------------------------

    const pivot = new THREE.Vector3();
    const position = new THREE.Vector3();
    const orientation = new THREE.Quaternion();
    const wobble = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scaleV = new THREE.Vector3();
    const tmpM = new THREE.Matrix4();
    const pivotM = new THREE.Matrix4();
    const tmpV = new THREE.Vector3();
    /** Hidden in the cloud, the plane grows a little, so it lands readable. */
    let grow = 1;
    const flight: Flight = { tilt: 0, yaw: 0, pitch: 0, roll: 0 };

    const headingTmp = new THREE.Vector3();
    /** The flight heading at progress p (p >= launch). */
    const headingAt = (l: Layout, p: number) =>
      headingOf(
        l.curve.getTangentAt(
          Math.min(flightEase(span(TIMELINE.launch[0], 1, p)), 0.999),
          headingTmp,
        ),
      );

    /** The paper's frame for progress p (no time-based motion). */
    const poseAt = (p: number, l: Layout) => {
      // Orientation.
      if (p < TIMELINE.edges[1]) {
        orientation.slerpQuaternions(
          K_FORM,
          K_FOLDING,
          smooth(0.02, TIMELINE.edges[1], p),
        );
      } else if (p < TIMELINE.turn[0]) {
        orientation.slerpQuaternions(
          K_FOLDING,
          K_PRESENT,
          smooth(TIMELINE.edges[1], TIMELINE.turn[0], p),
        );
      } else if (p < TIMELINE.launch[0]) {
        const t = smooth(TIMELINE.turn[0], TIMELINE.turn[1], p);
        flight.tilt = lerp(F_PRESENT.tilt, l.launch.tilt, t);
        flight.yaw = lerp(F_PRESENT.yaw, l.launch.yaw, t);
        flight.pitch = lerp(F_PRESENT.pitch, l.launch.pitch, t);
        flight.roll = lerp(F_PRESENT.roll, 0, t);
        attitude(flight, orientation);
      } else {
        const h = headingAt(l, p);
        // Bank into the turn: the heading's rate of change, eased in at launch.
        const ahead = headingAt(l, Math.min(1, p + 0.012)).yaw;
        const behind = headingAt(l, Math.max(TIMELINE.launch[0], p - 0.012)).yaw;
        const turn = Math.atan2(Math.sin(ahead - behind), Math.cos(ahead - behind));
        // Tipped further toward the camera for the arrival, so the wing tops
        // (and the stamp) read from above as it glides down.
        flight.tilt = lerp(FLIGHT_TILT, ARRIVAL_TILT, smooth(0.82, 0.94, p));
        flight.yaw = h.yaw;
        flight.pitch = h.pitch + NOSE_UP * (1 - smooth(0.85, 1, p) * 0.6);
        flight.roll =
          THREE.MathUtils.clamp(turn * BANK_GAIN, -BANK_MAX, BANK_MAX) *
          smooth(TIMELINE.launch[0], 0.58, p);
        attitude(flight, orientation);
      }

      // Position: resting in the slot, a small wind-up, then the flight path.
      if (p < TIMELINE.launch[0]) {
        position.copy(l.rest);
      } else {
        l.curve.getPointAt(flightEase(span(TIMELINE.launch[0], 1, p)), position);
      }
      const wind = smooth(0.45, 0.53, p) * (1 - smooth(0.53, 0.6, p));
      position.x += -0.06 * wind * l.scale;
      position.y += -0.05 * wind * l.scale;
      position.z += 0.32 * wind * l.scale;

      pivot.copy(BODY).multiplyScalar(smooth(TIMELINE.half[0], TIMELINE.wing[1], p));
      grow = lerp(1, ARRIVAL_GROW, smooth(0.8, 0.875, p));
      return { position, orientation, pivot };
    };

    const compose = (out: THREE.Matrix4, scale: number) => {
      scaleV.setScalar(scale);
      out.compose(position, orientation, scaleV);
      return out.multiply(pivotM.makeTranslation(-pivot.x, -pivot.y, -pivot.z));
    };

    // --- Layout -----------------------------------------------------------

    const measure = (): Layout | null => {
      const box = canvas.getBoundingClientRect();
      const w = box.width;
      const h = box.height;
      if (!w || !h) return null;
      const aspect = w / h;
      const wide = window.matchMedia("(min-width: 1024px)").matches;

      let sx = wide ? 0.5 : 0;
      let sy = wide ? 0 : -0.45;
      let fh = wide ? 0.62 : 0.3;
      let fw = wide ? 0.4 : 0.6;
      const slot = slotRef.current?.getBoundingClientRect();
      if (slot && slot.width > 8 && slot.height > 8) {
        sx = ((slot.left + slot.width / 2 - box.left) / w) * 2 - 1;
        sy = 1 - ((slot.top + slot.height / 2 - box.top) / h) * 2;
        fh = slot.height / h;
        fw = slot.width / w;
      }

      // Fit the sheet to the slot: most of its height, and never wider than it.
      const visible = 2 * CAMERA_Z * TAN;
      const byHeight = ((wide ? 0.64 : 0.84) * fh * visible) / (2 * HALF_H);
      const byWidth = (1.05 * fw * visible * aspect) / 1;
      const scale = Math.min(byHeight, byWidth);
      const rest = ndc(sx, sy, 0, aspect);

      // A point of the lagoon, where object-cover puts it at this aspect ratio.
      const k = Math.max(w / LAGOON.w, h / LAGOON.h);
      const fx = wide ? LAGOON.focus.wide : LAGOON.focus.compact;
      const onLagoon = (at: { x: number; y: number }) => ({
        x: (((w - LAGOON.w * k) * fx + at.x * k) / w) * 2 - 1,
        y: 1 - (((h - LAGOON.h * k) / 2 + at.y * k) / h) * 2,
      });
      const glide = onLagoon(wide ? LAGOON.glide.wide : LAGOON.glide.compact);

      const points = wide
        ? [
            rest,
            ndc(sx + 0.07, sy + 0.035, -2.4, aspect),
            ndc(0.44, 0.07, -8.5, aspect),
            ndc(0.25, 0.06, -14.5, aspect),
            ndc(glide.x - 0.2, glide.y + 0.3, -15, aspect),
            ndc(glide.x, glide.y, -19, aspect),
          ]
        : [
            rest,
            ndc(sx + 0.08, sy + 0.14, -2.2, aspect),
            ndc(0.3, 0.22, -8, aspect),
            ndc(0.1, 0.16, -13.5, aspect),
            ndc(glide.x - 0.3, glide.y + 0.27, -12.5, aspect),
            ndc(glide.x, glide.y, -17.5, aspect),
          ];
      const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
      const start = headingOf(curve.getTangentAt(0));
      return {
        wide,
        aspect,
        rest,
        scale,
        curve,
        launch: {
          tilt: FLIGHT_TILT,
          yaw: start.yaw,
          pitch: start.pitch + NOSE_UP,
          roll: 0,
        },
      };
    };

    /** Rebuilds the contrail ribbon along the tail's path for this layout. */
    const buildTrail = (l: Layout) => {
      const centers: THREE.Vector3[] = [];
      const phases: number[] = [];
      const from = TIMELINE.launch[0];
      for (let i = 0; i <= CONTRAIL_SAMPLES; i++) {
        const p = lerp(from, 1, i / CONTRAIL_SAMPLES);
        poseAt(p, l);
        compose(tmpM, l.scale * grow);
        centers.push(TAIL.clone().applyMatrix4(tmpM));
        phases.push(p);
      }
      const pos: number[] = [];
      const side: number[] = [];
      const sideVec: number[] = [];
      const phase: number[] = [];
      const index: number[] = [];
      const tangent = new THREE.Vector3();
      const toCam = new THREE.Vector3();
      const across = new THREE.Vector3();
      centers.forEach((c, i) => {
        const a = centers[Math.max(0, i - 1)];
        const b = centers[Math.min(centers.length - 1, i + 1)];
        tangent.subVectors(b, a).normalize();
        toCam.subVectors(camera.position, c).normalize();
        across.crossVectors(tangent, toCam).normalize();
        for (const s of [-1, 1]) {
          pos.push(c.x, c.y, c.z);
          sideVec.push(across.x, across.y, across.z);
          side.push(s);
          phase.push(phases[i]);
        }
        if (i > 0) {
          const k = i * 2;
          index.push(k - 2, k - 1, k, k - 1, k + 1, k);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("aSideVec", new THREE.Float32BufferAttribute(sideVec, 3));
      g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
      g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
      g.setIndex(index);
      trail.geometry.dispose();
      trail.geometry = g;
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 700 ? 1.5 : 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      layout = measure();
      if (layout) buildTrail(layout);
    };

    // --- Frame ------------------------------------------------------------

    const stampDecal = (now: number, p: number) => {
      if (baked || !canvases || !frontTex || readyAt < 0) return { jolt: 0 };
      // Scrolled before it landed (or arrived mid-page): just print it.
      const due = readyAt + 600;
      if (stampAt < 0 && (p > 0.015 || now < due)) {
        if (p > 0.015) bake();
        return { jolt: 0 };
      }
      if (stampAt < 0) stampAt = now;
      const t = (now - stampAt) / 1000;
      if (t >= 0.5 || p > 0.015) {
        bake();
        return { jolt: 0 };
      }
      if (decal) {
        decal.visible = true;
        const fall = clamp01(t / 0.15);
        const fallE = fall * fall;
        const settle = span(0.15, 0.34, t);
        const squash = 0.965 + 0.035 * (1 - Math.pow(1 - settle, 3));
        const scale = t < 0.15 ? lerp(1.6, 0.965, fallE) : squash;
        decal.scale.setScalar(scale);
        decal.position.z = 0.006 + 0.2 * (1 - fallE);
        (decal.material as THREE.MeshStandardMaterial).opacity = clamp01(t / 0.07);
      }
      // The paper gives under the blow: a damped push away from the stamp.
      const since = t - 0.15;
      const jolt = since > 0 ? Math.exp(-since / 0.09) * Math.cos(since * 26) : 0;
      return { jolt };
    };

    const bake = () => {
      if (baked || !canvases || !frontTex) return;
      canvases.bakeStamp();
      frontTex.needsUpdate = true;
      if (decal) decal.visible = false;
      baked = true;
    };

    const render = (p: number, now: number) => {
      if (disposed || !canvases || !layout) return;
      const l = layout;

      // Folds.
      const pose = foldPose(p);
      rig.setPose(pose);
      foldShade.uHalf.value = pose.half / HALF_ANGLE;
      foldShade.uWing.value = pose.wing / WING_ANGLE;
      for (const { piece, front, back } of meshes) {
        rig.matrixFor(piece, front.matrix);
        back.matrix.copy(front.matrix);
        front.matrixWorldNeedsUpdate = true;
        back.matrixWorldNeedsUpdate = true;
      }

      poseAt(p, l);

      // Idle drift: gentle while it rests, nearly gone once it is flying.
      const t = now / 1000;
      const calm = lerp(1, 0.18, smooth(0.43, 0.6, p));
      position.x += Math.sin(t * 0.53) * 0.016 * l.scale * calm;
      position.y += Math.sin(t * 0.71 + 1.3) * 0.026 * l.scale * calm;
      position.z += Math.sin(t * 0.41 + 0.4) * 0.02 * l.scale * calm;
      euler.set(
        Math.sin(t * 0.61 + 0.8) * 1.1 * DEG * calm,
        Math.sin(t * 0.37) * 1.5 * DEG * calm,
        Math.sin(t * 0.47 + 2) * 1.4 * DEG * calm,
      );
      orientation.premultiply(wobble.setFromEuler(euler));

      const { jolt } = stampDecal(now, p);
      if (jolt) {
        // Away from the viewer along the paper's normal, with a small tip.
        tmpV.set(0, 0, -0.03 * jolt * l.scale).applyQuaternion(orientation);
        position.add(tmpV);
        orientation.multiply(wobble.setFromAxisAngle(AX, 1.4 * DEG * jolt));
      }

      compose(paper.matrix, l.scale * grow);
      paper.matrixWorldNeedsUpdate = true;

      // Aerial perspective: the further away, the more of the sky's haze sits
      // between it and the camera. Into the cloud, it whites out, then clears
      // over the lagoon (seen from above, through less air).
      const inCloud = smooth(0.72, 0.82, p) * (1 - smooth(0.87, 0.95, p));
      const distance = Math.max(0.5, CAMERA_Z - position.z);
      const aerial = 0.3 * smooth(5.5, 24, distance) * (1 - 0.45 * smooth(0.88, 1, p));
      const hazeAmount = Math.max(inCloud * 0.92, aerial);
      const fog = scene.fog as THREE.Fog;
      fog.color.copy(hazeSky).lerp(hazeCloud, inCloud);
      fog.near = 0;
      fog.far = hazeAmount > 0.001 ? distance / hazeAmount : 1e6;

      // Contrail.
      trailUniforms.uHead.value = p;
      trailUniforms.uOpacity.value =
        0.85 * smooth(0.535, 0.56, p) * (1 - 0.85 * inCloud);

      renderer.render(scene, camera);

      if (readyAt < 0) {
        readyAt = now;
        ready.current();
      }
    };

    apiRef.current = { render };

    // --- Build (async: the canvas texture waits for the page's fonts) ------

    const build = async () => {
      const fonts = readPaperFonts();
      await loadPaperFonts(fonts);
      if (disposed) return;

      canvases = drawPaper(fonts);
      const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const texture = (source: HTMLCanvasElement) => {
        const tex = new THREE.CanvasTexture(source);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = anisotropy;
        disposables.push(tex);
        return tex;
      };
      frontTex = texture(canvases.front);
      const backTex = texture(canvases.back);
      const stampTex = texture(canvases.stamp);

      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        roughness: 0.84,
        metalness: 0,
        side: THREE.FrontSide,
      });
      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.88,
        metalness: 0,
        side: THREE.BackSide,
      });
      shadeFolds(frontMat, 1, foldShade);
      shadeFolds(backMat, -1, foldShade);
      disposables.push(frontMat, backMat);

      for (const piece of pieces) {
        const geometry = pieceGeometry(piece);
        disposables.push(geometry);
        const front = new THREE.Mesh(geometry, frontMat);
        const back = new THREE.Mesh(geometry, backMat);
        front.matrixAutoUpdate = false;
        back.matrixAutoUpdate = false;
        paper.add(front, back);
        meshes.push({ piece, front, back });
      }

      const decalGeometry = new THREE.PlaneGeometry(STAMP_SHEET.w, STAMP_SHEET.h);
      const decalMat = new THREE.MeshStandardMaterial({
        map: stampTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      });
      disposables.push(decalGeometry, decalMat);
      decal = new THREE.Mesh(decalGeometry, decalMat);
      decal.position.set(STAMP_SHEET.x, STAMP_SHEET.y, 0.2);
      decal.rotation.z = -STAMP.angle;
      decal.visible = false;
      decal.renderOrder = 1;
      paper.add(decal);

      resize();
    };

    build().catch(() => fail.current());

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Development only: renders the reduced-motion still (the folded plane,
    // mid-glide) on a transparent background and returns it as a PNG.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__heroPaperStill = (
        w = 960,
        h = 640,
      ) => {
        if (!layout) return null;
        bake();
        renderer.setPixelRatio(1);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        rig.setPose(foldPose(1));
        foldShade.uHalf.value = 1;
        foldShade.uWing.value = 1;
        for (const { piece, front, back } of meshes) {
          rig.matrixFor(piece, front.matrix);
          back.matrix.copy(front.matrix);
          front.matrixWorldNeedsUpdate = true;
          back.matrixWorldNeedsUpdate = true;
        }
        attitude(
          { tilt: 24 * DEG, yaw: 52 * DEG, pitch: 7 * DEG, roll: 16 * DEG },
          orientation,
        );
        position.set(0, 0, 0);
        pivot.copy(BODY);
        const fit = (2 * CAMERA_Z * TAN * 0.46) / (2 * HALF_H);
        compose(paper.matrix, fit);
        paper.matrixWorldNeedsUpdate = true;
        (scene.fog as THREE.Fog).far = 1e6;
        trail.visible = false;
        renderer.render(scene, camera);
        const url = canvas.toDataURL("image/png");
        trail.visible = true;
        resize();
        return url;
      };
    }

    return () => {
      disposed = true;
      apiRef.current = null;
      ro.disconnect();
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
      for (const d of disposables) d.dispose();
      renderer.dispose();
    };
  }, [apiRef, slotRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-ready={shown ? "" : undefined}
      className={className}
    />
  );
}

export default HeroPaper;
