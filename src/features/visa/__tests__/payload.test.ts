import { describe, expect, it } from "vitest";

import { toAmount } from "@/features/visa/types";
import { toApiPayload } from "@/validations/visa-application";

/**
 * `whitelist` + `forbidNonWhitelisted` mean the API rejects unknown keys, and
 * `@IsUrl()` / `@IsDateString()` both reject "". Empty optional fields have to
 * be omitted rather than sent blank.
 */
describe("toApiPayload", () => {
  const base = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    nationality: "British",
    targetCountry: "Canada",
    visaCategory: "TOURIST" as const,
    passportDataPageUrl: "https://cdn.example.com/a.pdf",
    passportPhotoWhiteBgUrl: "https://cdn.example.com/b.jpg",
  };

  it("drops empty strings rather than sending them", () => {
    const payload = toApiPayload({
      ...base,
      phone: "",
      dateOfBirth: "",
      proofOfFunds6MonthsUrl: "",
    } as never);

    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("dateOfBirth");
    expect(payload).not.toHaveProperty("proofOfFunds6MonthsUrl");
  });

  it("keeps every populated field", () => {
    const payload = toApiPayload({ ...base, phone: "+2348012345678" } as never);
    expect(payload).toMatchObject({ ...base, phone: "+2348012345678" });
  });

  it("drops empty arrays, which would also fail validation", () => {
    const payload = toApiPayload({ ...base, supportingDocUrls: [] } as never);
    expect(payload).not.toHaveProperty("supportingDocUrls");
  });

  it("keeps populated arrays", () => {
    const urls = ["https://cdn.example.com/c.pdf"];
    const payload = toApiPayload({ ...base, supportingDocUrls: urls } as never);
    expect(payload.supportingDocUrls).toEqual(urls);
  });
});

describe("toAmount", () => {
  it("parses the string decimals the API returns", () => {
    expect(toAmount("500.00")).toBe(500);
    expect(toAmount("0.00")).toBe(0);
  });

  it("treats null and empty as not-yet-set rather than zero", () => {
    expect(toAmount(null)).toBeNull();
    expect(toAmount("")).toBeNull();
    expect(toAmount(undefined)).toBeNull();
  });

  it("returns null for anything unparseable", () => {
    expect(toAmount("not-a-number")).toBeNull();
  });
});
