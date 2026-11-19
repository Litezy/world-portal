import { existsSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "@/components/common/logo";

const srcOf = (container: HTMLElement) =>
  decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? "");

describe("Logo", () => {
  it("ships a gold copy of each logo file", () => {
    for (const file of ["logo-gold.png", "logo-gold-light.png"]) {
      expect(existsSync(join(process.cwd(), "public/images", file))).toBe(true);
    }
  });

  it("stays blue unless the admin asks for gold", () => {
    expect(srcOf(render(<Logo tone="dark" />).container)).toContain("/images/logo.png");
    expect(srcOf(render(<Logo tone="light" />).container)).toContain(
      "/images/logo-light.png",
    );
  });

  it("uses the gold swoosh, in the right tone, for WorldStreet gold", () => {
    expect(srcOf(render(<Logo tone="dark" gold />).container)).toContain(
      "/images/logo-gold.png",
    );
    expect(srcOf(render(<Logo tone="light" gold />).container)).toContain(
      "/images/logo-gold-light.png",
    );
  });
});
