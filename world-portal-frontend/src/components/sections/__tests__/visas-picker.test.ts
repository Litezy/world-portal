import { describe, expect, it } from "vitest";

import { visas } from "@/content/landing";
import { resolveVisaRoute } from "@/features/visa/requirement";

/**
 * The Visas picker repeats the application's own ruleset for each
 * destination. These guard the content it is fed, since a typo'd country
 * code or a route with no card would otherwise fail silently on the page.
 */
describe("visas picker content", () => {
  const { picker } = visas;
  const verdicts = picker.destinations.map((d) => ({
    ...d,
    verdict: resolveVisaRoute(picker.passport, d.code),
  }));

  it("every destination is a real country", () => {
    for (const { code, verdict } of verdicts) {
      expect(verdict.destination?.code, code).toBe(code);
    }
  });

  it("every visa a destination needs has a card in the deck", () => {
    const cards = new Set(["evisa", "tvisa", "eta"]);
    for (const { code, verdict } of verdicts) {
      if (verdict.route === "visa-free") continue;
      expect(cards.has(verdict.route), code).toBe(true);
    }
  });

  it("offers no ETA destination (the ruleset's ETA list is for visa-exempt passports)", () => {
    for (const { code, verdict } of verdicts) {
      expect(verdict.route, code).not.toBe("eta");
    }
  });

  it("opens on a destination that needs a visa, so a card is dealt", () => {
    expect(verdicts[0]?.verdict.route).not.toBe("visa-free");
  });
});
