import { describe, expect, it } from "vitest";

import {
  applyScene,
  COMPACT_GLIDE_Y,
  PHONE_TAIL,
  sceneProgress,
  sheetLift,
} from "@/components/motion/hero-scene";

describe("the phone hero's clock (2026-11-09)", () => {
  it("plays the whole scene before the tail, then holds the landing", () => {
    expect(sceneProgress(0, PHONE_TAIL)).toBe(0);
    expect(sceneProgress((1 - PHONE_TAIL) / 2, PHONE_TAIL)).toBeCloseTo(0.5);
    expect(sceneProgress(1 - PHONE_TAIL, PHONE_TAIL)).toBe(1);
    expect(sceneProgress(1, PHONE_TAIL)).toBe(1);
  });

  it("leaves wider screens on the raw scroll", () => {
    expect(sceneProgress(0.37, 0)).toBe(0.37);
  });
});

describe("sheetLift", () => {
  it("centres the landed plane in what the sheet leaves open", () => {
    const panel = 828;
    const sheet = 380;
    const lift = sheetLift(panel, sheet);
    const plane = (COMPACT_GLIDE_Y - lift / 100) * panel;
    expect(plane).toBeCloseTo((60 + panel - sheet) / 2);
  });

  it("never lowers the scene, and never lifts it more than 40%", () => {
    expect(sheetLift(800, 10)).toBe(0);
    expect(sheetLift(400, 390)).toBe(40);
    expect(sheetLift(0, 380)).toBe(0);
  });
});

describe("the phone booking sheet", () => {
  const els = () => ({
    sheet: document.createElement("div"),
    lagoon: document.createElement("div"),
    paper: document.createElement("div"),
  });

  it("stays hidden, and out of the tab order, until the plane has landed", () => {
    const e = els();
    applyScene(e, 1, "compact", { raw: 1 - PHONE_TAIL, tail: PHONE_TAIL, lift: 25 });
    expect(e.sheet.style.visibility).toBe("hidden");
    expect(e.paper.style.transform).toBe("none");
  });

  it("is up at the end, with the lagoon and the plane lifted together", () => {
    const e = els();
    applyScene(e, 1, "compact", { raw: 1, tail: PHONE_TAIL, lift: 25 });
    expect(e.sheet.style.visibility).toBe("visible");
    expect(e.sheet.style.opacity).toBe("1.000");
    expect(e.sheet.style.transform).toBe("translate3d(0, 0.00%, 0)");
    expect(e.paper.style.transform).toBe("translate3d(0, -25.00%, 0)");
    expect(e.lagoon.style.transform).toContain("translate3d(0, -25.00%, 0)");
  });

  it("never shows on tablets, which keep the search in the copy", () => {
    const e = els();
    applyScene(e, 1, "compact");
    expect(e.sheet.style.visibility).toBe("hidden");
  });
});
