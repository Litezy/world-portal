import { describe, expect, it } from "vitest";

import { buildPlan, primaryStep, type TripAnswers } from "@/features/trip/plan";

const base: TripAnswers = {
  origin: "NG",
  destination: "CA",
  passport: null,
  visa: null,
  extras: [],
};

/**
 * The ordering here is the actual dependency chain, not presentation: a visa
 * is stamped into a passport, so a missing passport has to come first or the
 * visa application is wasted money.
 */
describe("buildPlan", () => {
  it("sends someone with no passport to the passport page first", () => {
    const [first] = buildPlan({ ...base, passport: "no", visa: "no" });
    expect(first.href).toBe("/passport");
    expect(first.state).toBe("now");
  });

  it("treats an expiring passport as blocking too", () => {
    const [first] = buildPlan({ ...base, passport: "expiring", visa: "no" });
    expect(first.href).toBe("/passport");
    expect(first.state).toBe("now");
  });

  it("holds the visa back until the passport is sorted", () => {
    const steps = buildPlan({ ...base, passport: "no", visa: "no" });
    expect(steps.find((s) => s.id === "visa")?.state).toBe("next");
  });

  it("makes the visa the immediate step when the passport is fine", () => {
    const steps = buildPlan({ ...base, passport: "yes", visa: "no" });
    expect(steps.find((s) => s.id === "passport")?.state).toBe("done");
    expect(steps.find((s) => s.id === "visa")?.state).toBe("now");
  });

  it("marks both done when the traveller already has everything", () => {
    const steps = buildPlan({ ...base, passport: "yes", visa: "yes" });
    expect(steps.every((s) => s.state === "done")).toBe(true);
    expect(primaryStep(steps)).toBeUndefined();
  });

  it("names the destination in the visa step", () => {
    const steps = buildPlan({ ...base, passport: "yes", visa: "unsure" });
    expect(steps.find((s) => s.id === "visa")?.title).toContain("Canada");
  });

  it("adds only the extras that were asked for", () => {
    const steps = buildPlan({
      ...base,
      passport: "yes",
      visa: "yes",
      extras: ["experiences"],
    });
    expect(steps.some((s) => s.id === "experiences")).toBe(true);
    expect(steps.some((s) => s.id === "flights-hotels")).toBe(false);
  });

  it("collapses flights and hotels into one step", () => {
    const steps = buildPlan({
      ...base,
      passport: "yes",
      visa: "yes",
      extras: ["flights", "hotels"],
    });
    expect(steps.filter((s) => s.id === "flights-hotels")).toHaveLength(1);
  });

  it("marks unopened services as soon, never as the next action", () => {
    const steps = buildPlan({
      ...base,
      passport: "yes",
      visa: "yes",
      extras: ["flights"],
    });
    expect(steps.find((s) => s.id === "flights-hotels")?.state).toBe("soon");
    expect(primaryStep(steps)).toBeUndefined();
  });
});

describe("country search", () => {
  it("finds countries by the name people actually type", async () => {
    const { countries, matchesQuery } = await import("@/lib/countries");
    const find = (q: string) => countries.filter((c) => matchesQuery(c, q));

    // Intl.DisplayNames says "Türkiye"; travellers type "Turkey".
    expect(find("Turkey").map((c) => c.code)).toContain("TR");
    expect(find("UK").map((c) => c.code)).toContain("GB");
    expect(find("USA").map((c) => c.code)).toContain("US");
    expect(find("UAE").map((c) => c.code)).toContain("AE");
    expect(find("Holland").map((c) => c.code)).toContain("NL");
    expect(find("South Korea").map((c) => c.code)).toContain("KR");
  });

  it("still matches the official name and the ISO code", async () => {
    const { countries, matchesQuery } = await import("@/lib/countries");
    const find = (q: string) => countries.filter((c) => matchesQuery(c, q));
    expect(find("Nigeria").map((c) => c.code)).toContain("NG");
    expect(find("ng").map((c) => c.code)).toContain("NG");
  });
});
