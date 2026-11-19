import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTableToolbar } from "@/components/admin/data-table";
import { DetailLoadError } from "@/components/admin/detail-load-error";
import { ApiError } from "@/lib/api-client";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("DataTableToolbar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("follows the URL when the search changes elsewhere (topbar, back/forward)", () => {
    const { rerender } = render(
      <DataTableToolbar search="ada" onSearch={() => {}} placeholder="Search" />,
    );
    expect(screen.getByLabelText("Search")).toHaveValue("ada");

    rerender(
      <DataTableToolbar search="chidi" onSearch={() => {}} placeholder="Search" />,
    );

    expect(screen.getByLabelText("Search")).toHaveValue("chidi");
  });

  it("does not clobber what was typed after its own search lands in the URL", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(
      <DataTableToolbar search="" onSearch={onSearch} placeholder="Search" />,
    );
    const input = screen.getByLabelText("Search");

    fireEvent.change(input, { target: { value: "abc" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearch).toHaveBeenCalledWith("abc");

    // Typing continues before the URL catches up with "abc".
    fireEvent.change(input, { target: { value: "abcd" } });
    rerender(
      <DataTableToolbar search="abc" onSearch={onSearch} placeholder="Search" />,
    );

    expect(input).toHaveValue("abcd");
  });
});

describe("DetailLoadError", () => {
  const props = {
    onRetry: vi.fn(),
    backHref: "/admin/applications",
    backLabel: "Back to applications",
    noun: "application",
  };

  it("treats a 404 as a dead link — no retry, a way back", () => {
    render(
      <DetailLoadError
        {...props}
        error={new ApiError({ message: "Not found", status: 404 })}
      />,
    );

    expect(screen.getByText("This application doesn't exist")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to applications" })).toHaveAttribute(
      "href",
      "/admin/applications",
    );
  });

  it("treats anything else as an outage and offers a retry", () => {
    const onRetry = vi.fn();
    render(
      <DetailLoadError
        {...props}
        onRetry={onRetry}
        error={
          new ApiError({
            message: "Could not reach the E-Embassy service.",
            status: 503,
          })
        }
      />,
    );

    expect(screen.getByText("Could not load this application")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
