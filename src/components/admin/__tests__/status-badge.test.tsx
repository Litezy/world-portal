import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ApplicationStatusBadge,
  EnquiryStatusBadge,
} from "@/components/admin/status-badge";

describe("status badges", () => {
  it("labels an enquiry status in words, not colour alone", () => {
    render(<EnquiryStatusBadge status="quoted" />);
    expect(screen.getByText("Quoted")).toBeInTheDocument();
  });

  it("expands an application status key into a readable stage", () => {
    render(<ApplicationStatusBadge status="documents_required" />);
    expect(screen.getByText("Documents required")).toBeInTheDocument();
  });

  it("carries the tone that matches the outcome", () => {
    const { container } = render(<ApplicationStatusBadge status="approved" />);
    expect(container.firstChild).toHaveClass("text-success");
  });
});
