import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton, SkeletonList, SkeletonText } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the requested number of text lines", () => {
    const { container } = render(<SkeletonText lines={4} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });

  it("renders an avatar plus two lines per list row", () => {
    const { container } = render(<SkeletonList count={3} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(9);
  });
});

describe("Spinner", () => {
  it("announces a loading label", async () => {
    const { Spinner } = await import("@/components/ui/spinner");
    render(<Spinner />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
});
