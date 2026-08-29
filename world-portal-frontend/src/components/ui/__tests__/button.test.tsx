import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Book Now</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Book Now" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies the yellow glass treatment by default", () => {
    render(<Button>Book Now</Button>);
    expect(screen.getByRole("button")).toHaveClass("glass-primary", "glass-3d");
  });

  it("is disabled and busy while loading", () => {
    render(<Button isLoading>Submit</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("swaps in loadingText so the label reflects the pending state", () => {
    render(
      <Button isLoading loadingText="Sending…">
        Send
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Sending…");
  });

  it("ignores clicks while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Send
      </Button>,
    );

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders as its child when asChild is set", () => {
    render(
      <Button asChild>
        <a href="#contact">Contact</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Contact" });
    expect(link).toHaveAttribute("href", "#contact");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
