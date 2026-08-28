import { describe, expect, it } from "vitest";

import { resolveVisaRoute } from "@/features/visa/requirement";

/**
 * The origin/destination pair decides everything downstream: an eVisa or ETA
 * is completed online with uploads, a T.Visa is information-only because the
 * embassy needs the applicant in person.
 */
describe("resolveVisaRoute", () => {
  it("routes ETA destinations to the electronic authorisation", () => {
    for (const to of ["US", "CA", "GB", "AU", "NZ", "KR"]) {
      const v = resolveVisaRoute("NG", to);
      expect(v.route, `${to} should be an ETA`).toBe("eta");
      expect(v.online).toBe(true);
    }
  });

  it("routes known eVisa destinations online", () => {
    for (const to of ["TR", "IN", "KE", "VN", "AE"]) {
      const v = resolveVisaRoute("NG", to);
      expect(v.route, `${to} should be an eVisa`).toBe("evisa");
      expect(v.online).toBe(true);
    }
  });

  it("falls back to the traditional embassy route", () => {
    const v = resolveVisaRoute("NG", "FR");
    expect(v.route).toBe("tvisa");
    // This is the whole point of the branch — no online submission.
    expect(v.online).toBe(false);
  });

  it("recognises free movement inside a bloc", () => {
    expect(resolveVisaRoute("FR", "DE").route).toBe("visa-free");
    expect(resolveVisaRoute("NG", "GH").route).toBe("visa-free");
    expect(resolveVisaRoute("KE", "UG").route).toBe("visa-free");
  });

  it("treats the same country as needing nothing", () => {
    expect(resolveVisaRoute("NG", "NG").route).toBe("visa-free");
  });

  it("carries both countries through for the summary", () => {
    const v = resolveVisaRoute("NG", "CA");
    expect(v.origin?.name).toBe("Nigeria");
    expect(v.destination?.name).toBe("Canada");
  });

  it("always explains what happens next", () => {
    for (const to of ["CA", "TR", "FR", "GH"]) {
      const v = resolveVisaRoute("NG", to);
      expect(v.next.length).toBeGreaterThan(0);
      expect(v.summary.length).toBeGreaterThan(20);
    }
  });

  it("degrades safely when a code is unknown", () => {
    const v = resolveVisaRoute("", "ZZ");
    expect(v.route).toBe("visa-free");
    expect(v.origin).toBeUndefined();
  });
});
