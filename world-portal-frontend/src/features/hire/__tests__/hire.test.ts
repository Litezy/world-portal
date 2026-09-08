import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { professionals, professionLabels, professions } from "@/content/professionals";
import { toBasketItem } from "@/features/hire/components/hire-browser";

describe("professionals data", () => {
  it("gives every professional a unique id", () => {
    const ids = professionals.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses professions that have a label", () => {
    for (const p of professionals) {
      expect(professions).toContain(p.profession);
      expect(professionLabels[p.profession]).toBeTruthy();
    }
  });

  it("covers every profession, so no filter chip is ever empty", () => {
    for (const profession of professions) {
      expect(
        professionals.some((p) => p.profession === profession),
        `no professional for "${profession}"`,
      ).toBe(true);
    }
  });

  it("gives every professional a price, a unit and at least one package", () => {
    for (const p of professionals) {
      expect(p.price, p.name).toBeGreaterThan(0);
      expect(p.unit, p.name).toBeTruthy();
      expect(p.packages.length, p.name).toBeGreaterThan(0);
    }
  });

  it("points every portrait at a file that actually exists", () => {
    // A typo in the slug renders a broken image with no error anywhere.
    for (const p of professionals) {
      expect(p.photo, `${p.name} has no portrait`).toBeTruthy();
      expect(
        existsSync(join(process.cwd(), "public", p.photo!)),
        `missing public${p.photo}`,
      ).toBe(true);
    }
  });

  it("keeps ratings within range", () => {
    for (const p of professionals) {
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
    }
  });
});

describe("toBasketItem", () => {
  it("namespaces the id so it cannot collide with a flight or a stay", () => {
    const item = toBasketItem(professionals[0]);
    expect(item.id).toBe(`pro:${professionals[0].id}`);
    expect(item.type).toBe("pro");
  });

  it("carries the price, city and unit through to the basket line", () => {
    const pro = professionals[0];
    const item = toBasketItem(pro);
    expect(item.price).toBe(pro.price);
    expect(item.city).toBe(pro.city);
    expect(item.subtitle).toContain(pro.unit);
  });
});
