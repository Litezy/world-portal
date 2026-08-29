import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal } from "@/components/motion/reveal";

/**
 * These components hide their content before revealing it, so the thing worth
 * guarding is that the content is always in the document — an animation must
 * never be able to swallow copy.
 */
describe("Reveal", () => {
  it("renders its children", () => {
    render(
      <Reveal>
        <p>Visas, without the guesswork.</p>
      </Reveal>,
    );
    expect(screen.getByText("Visas, without the guesswork.")).toBeInTheDocument();
  });

  it("renders every child when staggering", () => {
    render(
      <Reveal stagger={0.1}>
        <span>one</span>
        <span>two</span>
        <span>three</span>
      </Reveal>,
    );
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("three")).toBeInTheDocument();
  });

  it("honours the `as` prop so lists stay lists", () => {
    const { container } = render(
      <Reveal as="ul" stagger={0.1}>
        <li>item</li>
      </Reveal>,
    );
    expect(container.querySelector("ul")).not.toBeNull();
  });
});

describe("ParallaxImage", () => {
  it("keeps the alt text on the underlying image", () => {
    render(
      <ParallaxImage
        src="/images/visas/evisa.jpg"
        alt="An airport concourse at night"
        fill
        sizes="200px"
      />,
    );
    expect(screen.getByAltText("An airport concourse at night")).toBeInTheDocument();
  });
});
