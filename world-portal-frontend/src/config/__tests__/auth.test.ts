import { describe, expect, it } from "vitest";

import {
  isApplicantProtectedPath,
  WORLDSTREET_SIGN_IN_URL,
  worldStreetSignInUrl,
} from "@/config/auth";

describe("isApplicantProtectedPath", () => {
  it.each(["/applicant", "/applicant/hires", "/apply", "/passport", "/passport/new"])(
    "requires a WorldStreet session for %s",
    (path) => {
      expect(isApplicantProtectedPath(path)).toBe(true);
    },
  );

  it.each([
    "/",
    "/start",
    "/hire",
    "/services/evisa",
    "/applying",
    "/passports",
    "/track",
  ])("leaves %s public", (path) => {
    expect(isApplicantProtectedPath(path)).toBe(false);
  });
});

describe("worldStreetSignInUrl", () => {
  it("defaults to the WorldStreet hub's login", () => {
    expect(WORLDSTREET_SIGN_IN_URL).toBe("https://www.worldstreetgold.com/login");
  });

  it("returns to an absolute URL on this site after signing in", () => {
    const url = new URL(
      worldStreetSignInUrl("/apply?from=start", "https://embassy.worldstreetgold.com"),
    );

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://www.worldstreetgold.com/login",
    );
    expect(url.searchParams.get("redirect_url")).toBe(
      "https://embassy.worldstreetgold.com/apply?from=start",
    );
  });
});
