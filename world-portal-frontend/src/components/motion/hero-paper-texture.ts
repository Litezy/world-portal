import { LOGO_GRID, WING_LOWER, WING_UPPER } from "@/components/common/logo-geometry";

/**
 * The visa form the hero's paper is printed with, drawn at runtime with
 * Canvas2D: an A4 sheet at 1024 × 1448 (1024 px per sheet unit, both ways).
 * Nothing here is real data. The values are a sample trip that matches the
 * hero's forecast card (Malé), and the whole canvas is decoration.
 */

export const TEX_W = 1024;
export const TEX_H = 1448;

/** Paper and ink. Literal colours: this is a picture of paper, not UI. */
const PAPER = "#f7f6f1";
const BLUE = "#0050c0";
const CYAN = "#00b8f8";
const INK = "#1b2f66";
const PRINT = "#1a2440";
const LABEL = "#78819a";
const RULE = "#cfd5e0";

/**
 * The APPROVED stamp, in texture pixels: centre, size and tilt. It sits low
 * on the right, so once the plane is folded it lands on top of the right
 * wing, near the trailing edge.
 */
export const STAMP = { cx: 806, cy: 1268, w: 372, h: 176, angle: (-8 * Math.PI) / 180 };

/** The same stamp in sheet coordinates (centre, size), for the decal. */
export const STAMP_SHEET = {
  x: STAMP.cx / TEX_W - 0.5,
  y: Math.SQRT1_2 - STAMP.cy / TEX_W,
  w: STAMP.w / TEX_W,
  h: STAMP.h / TEX_W,
};

export type PaperFonts = { sans: string; serif: string };

/** The page's own faces (next/font), with safe fallbacks for the canvas. */
export function readPaperFonts(): PaperFonts {
  const style = getComputedStyle(document.documentElement);
  const sans = style.getPropertyValue("--font-sans-family").trim();
  const serif = style.getPropertyValue("--font-display-family").trim();
  return {
    sans: `${sans || "Manrope"}, system-ui, sans-serif`,
    serif: `${serif || "Playfair Display"}, Georgia, serif`,
  };
}

/** Waits (briefly) for the faces the canvas draws with. */
export async function loadPaperFonts(fonts: PaperFonts) {
  if (!document.fonts?.load) return;
  const wanted = [
    `800 40px ${fonts.sans}`,
    `700 20px ${fonts.sans}`,
    `600 18px ${fonts.sans}`,
    `italic 400 40px ${fonts.serif}`,
  ];
  await Promise.race([
    Promise.all(wanted.map((font) => document.fonts.load(font))).catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
}

function canvas(w: number, h: number) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { el, ctx };
}

/** A small deterministic PRNG, so the paper's fibres are the same every load. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Off-white stock with a very faint grain and a few short fibres. */
function paper(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const rand = random(seed);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * 7;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);

  ctx.lineCap = "round";
  for (let i = 0; i < (w * h) / 2600; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const len = 4 + rand() * 14;
    const a = rand() * Math.PI;
    ctx.strokeStyle = rand() > 0.5 ? "rgba(120,110,90,0.07)" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = 0.6 + rand() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a) * len * 0.5 + (rand() - 0.5) * 4,
      y + Math.sin(a) * len * 0.5 + (rand() - 0.5) * 4,
      x + Math.cos(a) * len,
      y + Math.sin(a) * len,
    );
    ctx.stroke();
  }
}

function spaced(ctx: CanvasRenderingContext2D, px: number) {
  // Canvas letter-spacing is widely supported now; older engines just ignore it.
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
    `${px}px`;
}

function label(
  ctx: CanvasRenderingContext2D,
  fonts: PaperFonts,
  text: string,
  x: number,
  y: number,
) {
  ctx.font = `700 14px ${fonts.sans}`;
  spaced(ctx, 2.4);
  ctx.fillStyle = LABEL;
  ctx.fillText(text.toUpperCase(), x, y);
  spaced(ctx, 0);
}

/** A labelled line with a handwritten value (Playfair italic, in ink). */
function field(
  ctx: CanvasRenderingContext2D,
  fonts: PaperFonts,
  name: string,
  value: string,
  x: number,
  y: number,
  w: number,
) {
  label(ctx, fonts, name, x, y - 52);
  ctx.font = `italic 400 40px ${fonts.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText(value, x + 6, y);
  ctx.fillStyle = RULE;
  ctx.fillRect(x, y + 14, w, 2);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** The E-Embassy wings, from the logo's own paths. */
function wings(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  const scale = height / LOGO_GRID.height;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fill(new Path2D(WING_UPPER));
  ctx.fillStyle = CYAN;
  ctx.fill(new Path2D(WING_LOWER));
  ctx.restore();
}

/** Everything printed or written on the form, minus the stamp. */
function form(ctx: CanvasRenderingContext2D, fonts: PaperFonts) {
  ctx.textBaseline = "alphabetic";

  // Header band.
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, TEX_W, 128);
  ctx.fillStyle = CYAN;
  ctx.fillRect(0, 128, TEX_W, 5);
  wings(ctx, 64, 36, 56);
  ctx.font = `700 22px ${fonts.sans}`;
  spaced(ctx, 4.5);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("E-EMBASSY · VISA APPLICATION", 216, 74);
  spaced(ctx, 0);

  // Title and reference.
  ctx.font = `800 34px ${fonts.sans}`;
  ctx.fillStyle = PRINT;
  ctx.fillText("Short-stay visa", 64, 204);
  ctx.font = `600 18px ${fonts.sans}`;
  ctx.fillStyle = LABEL;
  ctx.textAlign = "right";
  ctx.fillText("REF  EE-2611-0473", TEX_W - 64, 202);
  ctx.textAlign = "left";

  // Passport photo box: corner marks, a soft silhouette, a caption.
  const px = 64;
  const py = 252;
  const pw = 212;
  const ph = 268;
  ctx.fillStyle = "#e8ebf1";
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = "#cdd4e1";
  ctx.beginPath();
  ctx.arc(px + pw / 2, py + 112, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px + pw / 2, py + ph + 6, 92, 104, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#9ea8bc";
  ctx.lineWidth = 3;
  const tick = 22;
  for (const [cx, cy, dx, dy] of [
    [px, py, 1, 1],
    [px + pw, py, -1, 1],
    [px, py + ph, 1, -1],
    [px + pw, py + ph, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * tick);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * tick, cy);
    ctx.stroke();
  }
  label(ctx, fonts, "Photo", px, py + ph + 34);

  // Fields beside the photo.
  const fx = 324;
  const fw = TEX_W - 64 - fx;
  field(ctx, fonts, "Destination", "Malé, Maldives", fx, 318, fw);
  field(ctx, fonts, "Travel dates", "12 to 19 March", fx, 416, fw);
  field(ctx, fonts, "Passport", "Nigeria", fx, 514, fw);

  // Full-width fields.
  field(ctx, fonts, "Purpose of visit", "Holiday", 64, 652, 400);
  field(ctx, fonts, "Length of stay", "7 nights", 524, 652, TEX_W - 64 - 524);
  field(
    ctx,
    fonts,
    "Accommodation",
    "Overwater villa, North Malé Atoll",
    64,
    760,
    TEX_W - 128,
  );

  // Checklist.
  ctx.font = `600 19px ${fonts.sans}`;
  let cx = 64;
  for (const item of ["Return ticket", "Hotel booking", "Bank statement"]) {
    ctx.strokeStyle = "#8f99ad";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, 830, 24, 24);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(cx + 4, 842);
    ctx.lineTo(cx + 10, 851);
    ctx.lineTo(cx + 27, 826);
    ctx.stroke();
    ctx.fillStyle = PRINT;
    ctx.fillText(item, cx + 38, 850);
    cx += 38 + ctx.measureText(item).width + 48;
  }

  // Declaration.
  ctx.font = `500 17px ${fonts.sans}`;
  ctx.fillStyle = "#6a7389";
  ctx.fillText(
    "I confirm that the information in this application is true and complete,",
    64,
    918,
  );
  ctx.fillText("and that I will leave before my visa expires.", 64, 944);

  ctx.fillStyle = RULE;
  ctx.fillRect(64, 990, TEX_W - 128, 2);

  // Signature, lower left (it ends up on the left wing).
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(92, 1206);
  ctx.bezierCurveTo(118, 1130, 150, 1132, 140, 1196);
  ctx.bezierCurveTo(132, 1236, 176, 1150, 200, 1168);
  ctx.bezierCurveTo(222, 1186, 206, 1214, 236, 1198);
  ctx.bezierCurveTo(268, 1180, 282, 1150, 300, 1178);
  ctx.bezierCurveTo(314, 1200, 336, 1192, 372, 1170);
  ctx.stroke();
  ctx.fillStyle = RULE;
  ctx.fillRect(64, 1228, 400, 2);
  label(ctx, fonts, "Applicant signature", 64, 1262);

  // The box the stamp lands in.
  label(ctx, fonts, "For official use", 548, 1034);
  ctx.strokeStyle = "#c3cad8";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(548, 1052, TEX_W - 64 - 548, 316);
  ctx.setLineDash([]);

  // A machine-readable line along the foot of the sheet.
  ctx.font = `500 25px ui-monospace, "Cascadia Mono", Consolas, monospace`;
  spaced(ctx, 3);
  ctx.fillStyle = "#8d96a9";
  ctx.fillText("VAMDV<<NGA<<MALE<MLE<<EE26110473<<<<<<<<<<", 64, 1410);
  spaced(ctx, 0);
}

/**
 * The rubber stamp on its own transparent canvas, unrotated: a double border,
 * APPROVED, and worn ink. Used as the decal while it lands, then baked into
 * the front texture.
 */
export function drawStamp(fonts: PaperFonts) {
  const { el, ctx } = canvas(STAMP.w, STAMP.h);
  const { w, h } = STAMP;
  ctx.fillStyle = BLUE;
  ctx.strokeStyle = BLUE;

  ctx.lineWidth = 7;
  roundRect(ctx, 6, 6, w - 12, h - 12, 20);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  roundRect(ctx, 18, 18, w - 36, h - 36, 11);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 17px ${fonts.sans}`;
  spaced(ctx, 6);
  ctx.fillText("E-EMBASSY", w / 2 + 3, 50);

  // APPROVED, fitted to the inner box.
  spaced(ctx, 3);
  let size = 66;
  ctx.font = `800 ${size}px ${fonts.sans}`;
  const room = w - 64;
  const measured = ctx.measureText("APPROVED").width;
  if (measured > room) {
    size = Math.floor((size * room) / measured);
    ctx.font = `800 ${size}px ${fonts.sans}`;
  }
  ctx.fillText("APPROVED", w / 2 + 1.5, h / 2 + size * 0.36);

  ctx.font = `700 14px ${fonts.sans}`;
  spaced(ctx, 4);
  ctx.fillText("VISA GRANTED · 03 MAR", w / 2 + 2, h - 34);
  spaced(ctx, 0);

  // Worn ink: specks where the rubber missed, and lighter pressure on one side.
  const rand = random(7);
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 1400; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.75;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, 0.4 + rand() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.12 + rand() * 0.2;
    const y = rand() * h;
    ctx.fillRect(rand() * w * 0.6, y, 30 + rand() * 120, 1 + rand() * 2);
  }
  ctx.globalAlpha = 1;
  const fade = ctx.createLinearGradient(0, 0, w, h);
  fade.addColorStop(0, "rgba(0,0,0,0.38)");
  fade.addColorStop(0.45, "rgba(0,0,0,0.05)");
  fade.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  return el;
}

/** Presses the stamp into a front canvas: rotated, slightly see-through ink. */
function pressStamp(ctx: CanvasRenderingContext2D, stamp: HTMLCanvasElement) {
  ctx.save();
  ctx.translate(STAMP.cx, STAMP.cy);
  ctx.rotate(STAMP.angle);
  ctx.globalAlpha = 0.86;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(stamp, -STAMP.w / 2, -STAMP.h / 2);
  ctx.restore();
}

export type PaperCanvases = {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  stamp: HTMLCanvasElement;
  /** Redraws the front (and its show-through) with the stamp pressed in. */
  bakeStamp: () => void;
};

export function drawPaper(fonts: PaperFonts): PaperCanvases {
  const front = canvas(TEX_W, TEX_H);
  paper(front.ctx, TEX_W, TEX_H, 11);
  form(front.ctx, fonts);
  const plain = document.createElement("canvas");
  plain.width = TEX_W;
  plain.height = TEX_H;
  plain.getContext("2d")?.drawImage(front.el, 0, 0);

  // The back is plain stock at half size, with the front's ink showing
  // through faintly. Drawn unmirrored: seen from behind, it reads mirrored,
  // which is what real show-through does.
  const back = canvas(TEX_W / 2, TEX_H / 2);
  const showThrough = (source: HTMLCanvasElement) => {
    paper(back.ctx, TEX_W / 2, TEX_H / 2, 29);
    back.ctx.save();
    back.ctx.globalAlpha = 0.07;
    back.ctx.globalCompositeOperation = "multiply";
    back.ctx.filter = "blur(1.2px)";
    back.ctx.drawImage(source, 0, 0, TEX_W / 2, TEX_H / 2);
    back.ctx.restore();
  };
  showThrough(front.el);

  const stamp = drawStamp(fonts);

  return {
    front: front.el,
    back: back.el,
    stamp,
    bakeStamp: () => {
      front.ctx.drawImage(plain, 0, 0);
      pressStamp(front.ctx, stamp);
      showThrough(front.el);
    },
  };
}
