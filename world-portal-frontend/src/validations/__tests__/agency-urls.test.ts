import { describe, expect, it } from "vitest";

import {
  agencyListingSchema,
  listingPatchSchema,
  newStaffSchema,
  setDocumentSchema,
} from "@/validations/agency";

/**
 * Links an agency supplies are opened by desk staff in the admin console, so
 * they are https only: `z.url()` alone accepts `javascript:` and `data:`.
 */
const NOT_HTTPS = [
  "javascript:alert(document.cookie)",
  "data:text/html,<script>alert(1)</script>",
  "http://example.com/file.pdf",
  "ftp://example.com/file.pdf",
];

describe("agency-supplied URLs are https only", () => {
  it.each(NOT_HTTPS)("a document's fileUrl refuses %s", (fileUrl) => {
    const parsed = setDocumentSchema.safeParse({
      kind: "business_registration",
      fileName: "file.pdf",
      fileUrl,
    });
    expect(parsed.success).toBe(false);
  });

  it("a document's fileUrl accepts https", () => {
    const parsed = setDocumentSchema.safeParse({
      kind: "business_registration",
      fileName: "file.pdf",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/file.pdf",
    });
    expect(parsed.success).toBe(true);
  });

  it.each(NOT_HTTPS)("the listing's logoUrl and website refuse %s", (url) => {
    expect(listingPatchSchema.safeParse({ logoUrl: url }).success).toBe(false);
    expect(listingPatchSchema.safeParse({ website: url }).success).toBe(false);
    expect(
      agencyListingSchema.shape.website.safeParse(url).success,
      "full listing website",
    ).toBe(false);
    expect(
      agencyListingSchema.shape.logoUrl.safeParse(url).success,
      "full listing logo",
    ).toBe(false);
  });

  it.each(NOT_HTTPS)("a staff photoUrl refuses %s", (url) => {
    expect(newStaffSchema.shape.photoUrl.safeParse(url).success).toBe(false);
  });

  it("still accepts https links and still reads a blank as no link", () => {
    expect(listingPatchSchema.parse({ website: "https://agency.example" })).toEqual({
      website: "https://agency.example",
    });
    expect(listingPatchSchema.parse({ website: "", logoUrl: null })).toEqual({
      website: null,
      logoUrl: null,
    });
  });
});
