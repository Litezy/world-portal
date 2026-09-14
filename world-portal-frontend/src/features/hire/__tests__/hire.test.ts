import { describe, expect, it } from "vitest";

import {
  type Professional,
  professionLabels,
  professions,
} from "@/content/professionals";
import { toBasketItem } from "@/features/hire/components/hire-browser";

const mockPro: Professional = {
  id: "test-pro",
  name: "Test Professional",
  tagline: "Test Tagline",
  profession: "photographer",
  city: "Lagos",
  country: "Nigeria",
  languages: ["English"],
  rating: 4.9,
  jobs: 10,
  years: 3,
  price: 150,
  unit: "per session",
  about: "Test about description",
  availability: "Daily",
  packages: [{ name: "Standard", description: "Standard session", price: 150 }],
  included: ["Service"],
  skills: ["Photography"],
  cancellation: "Flexible",
  verified: true,
};

describe("professions labels and types", () => {
  it("only uses professions that have a valid label", () => {
    for (const profession of professions) {
      expect(professionLabels[profession]).toBeTruthy();
    }
  });
});

describe("toBasketItem", () => {
  it("namespaces the id so it cannot collide with a flight or a stay", () => {
    const item = toBasketItem(mockPro);
    expect(item.id).toBe(`pro:${mockPro.id}`);
    expect(item.type).toBe("pro");
  });

  it("carries the price, city and unit through to the basket line", () => {
    const item = toBasketItem(mockPro);
    expect(item.price).toBe(mockPro.price);
    expect(item.city).toBe(mockPro.city);
    expect(item.subtitle).toContain(mockPro.unit);
  });
});
