import { describe, expect, it } from "vitest";

import { whyUs } from "@/content/landing";

describe("why us statement", () => {
  // The gold marker is lifted out of the sentence by searching for it; if the
  // copy is reworded and the mark no longer occurs, the stroke quietly vanishes.
  it("marks words that occur in the statement", () => {
    expect(whyUs.body).toContain(whyUs.bodyMark);
  });
});
