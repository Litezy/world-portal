import { describe, expect, it } from "vitest";

import {
  cn,
  formatCurrency,
  formatRange,
  initials,
  slugify,
  truncate,
} from "@/lib/utils";

describe("cn", () => {
  it("lets the later Tailwind utility win", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy values", () => {
    expect(cn("base", false && "hidden", undefined, "extra")).toBe("base extra");
  });
});

describe("formatCurrency", () => {
  it("hides decimals on whole amounts", () => {
    expect(formatCurrency(450)).toBe("$450");
  });

  it("keeps decimals when they matter", () => {
    expect(formatCurrency(450.5)).toBe("$450.50");
  });
});

describe("formatRange", () => {
  it("collapses an identical range", () => {
    expect(formatRange(5, 5, "days")).toBe("5 days");
  });

  it("renders an en dash between bounds", () => {
    expect(formatRange(3, 5, "days")).toBe("3–5 days");
  });
});

describe("slugify", () => {
  it("strips accents and punctuation", () => {
    expect(slugify("Côte d'Ivoire — Tourist Visa!")).toBe("cote-d-ivoire-tourist-visa");
  });
});

describe("truncate", () => {
  it("leaves short strings alone", () => {
    expect(truncate("Lagos", 10)).toBe("Lagos");
  });

  it("appends an ellipsis when it cuts", () => {
    expect(truncate("Kuala Lumpur", 6)).toBe("Kuala…");
  });
});

describe("initials", () => {
  it("takes the first letter of each name", () => {
    expect(initials("Ada Byron Lovelace")).toBe("AB");
  });
});
