import { describe, expect, it } from "vitest";

import { safeHttpsUrl } from "@/lib/safe-url";

/**
 * Applicants and agencies supply the links the admin console opens: document
 * uploads, a website. A `javascript:` or `data:` link in an iframe, an img or
 * an <a> runs in the console's origin with a desk member's session behind it,
 * so the console renders a supplied URL only when it is plain https.
 */
describe("safeHttpsUrl", () => {
  it("returns an https URL, normalised", () => {
    expect(safeHttpsUrl("https://res.cloudinary.com/demo/raw/upload/a.pdf")).toBe(
      "https://res.cloudinary.com/demo/raw/upload/a.pdf",
    );
    expect(safeHttpsUrl("  HTTPS://Example.com/x  ")).toBe("https://example.com/x");
  });

  it.each([
    ["javascript:alert(document.cookie)"],
    ["JaVaScRiPt:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["vbscript:msgbox(1)"],
    ["http://example.com/a.pdf"],
    ["ftp://example.com/a.pdf"],
    ["file:///etc/passwd"],
    ["blob:https://example.com/uuid"],
    ["//example.com/a.pdf"],
    ["/uploads/a.pdf"],
    ["not a url"],
    [""],
    ["   "],
  ])("refuses %s", (value) => {
    expect(safeHttpsUrl(value)).toBeNull();
  });

  it("refuses anything that isn't a string", () => {
    for (const value of [null, undefined, 42, {}, ["https://example.com"]]) {
      expect(safeHttpsUrl(value)).toBeNull();
    }
  });
});
