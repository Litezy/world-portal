import { describe, expect, it } from "vitest";

import { parseValidationMessages } from "@/lib/api-client";

/**
 * The API has no exception filter, so DTO failures arrive as a flat string
 * array on a 400 — no `errors` object and never a 422. These are the exact
 * shapes class-validator emits for the visa DTO.
 */
describe("parseValidationMessages", () => {
  it("keys each message by the property it names", () => {
    expect(
      parseValidationMessages([
        "email must be an email",
        "firstName should not be empty",
      ]),
    ).toEqual({
      email: ["Email must be an email"],
      firstName: ["FirstName should not be empty"],
    });
  });

  it("groups multiple messages for the same field", () => {
    const result = parseValidationMessages([
      "passportDataPageUrl must be a URL address",
      "passportDataPageUrl should not be empty",
    ]);
    expect(result.passportDataPageUrl).toHaveLength(2);
  });

  it("extracts the field from a forbidNonWhitelisted message", () => {
    // `forbidNonWhitelisted: true` phrases it as "property X should not exist",
    // where the offending field is the second word, not the first.
    expect(parseValidationMessages(["property nickname should not exist"])).toEqual({
      nickname: ["Property nickname should not exist"],
    });
  });

  it("ignores messages it cannot attribute to a field", () => {
    expect(parseValidationMessages(["   "])).toEqual({});
  });
});
