import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeading } from "@/components/ui/section-heading";

describe("SectionHeading", () => {
  it("joins the sans lead and the serif accent into one heading", () => {
    render(
      <SectionHeading eyebrow="Destinations" lead="Places You'll" accent="Visit" />,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Places You'll Visit");
  });

  it("sets the accent in the display serif", () => {
    render(<SectionHeading lead="Curated" accent="Packages" />);
    expect(screen.getByText("Packages")).toHaveClass("heading-serif");
  });

  it("renders the eyebrow pill and supporting copy when given", () => {
    render(
      <SectionHeading eyebrow="FAQ" lead="Frequently Asked" body="Some help text." />,
    );

    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("Some help text.")).toBeInTheDocument();
  });

  it("omits the eyebrow when none is given", () => {
    const { container } = render(<SectionHeading lead="Just a heading" />);
    expect(container.querySelector('[data-slot="badge"]')).toBeNull();
  });
});
