import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DocumentViewerModal } from "@/features/applications/components/document-viewer-modal";

/**
 * The viewer frames whatever URL an applicant's or agency's record carries, in
 * an iframe, an img and download links, inside the admin console. Anything but
 * https is shown as unavailable and never reaches the DOM.
 */
describe("DocumentViewerModal", () => {
  it.each([
    "javascript:alert(document.cookie)",
    "data:text/html,<script>alert(1)</script>",
    "http://files.example.com/passport.pdf",
  ])("shows %s as unavailable and renders nothing that loads it", (url) => {
    const { container } = render(<DocumentViewerModal label="Passport" url={url} />);

    expect(screen.getByText(/link unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view document/i })).toBeNull();
    expect(container.innerHTML).not.toContain(url.slice(0, 10));
  });

  it("opens an https document with links to that document", () => {
    // An image, not a PDF: the test DOM would fetch an iframe's src for real.
    const url = "https://res.cloudinary.com/demo/image/upload/passport.png";
    render(<DocumentViewerModal label="Passport" url={url} />);

    fireEvent.click(screen.getByRole("button", { name: /view document/i }));

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", url);
    expect(screen.getByAltText("Passport")).toHaveAttribute("src", url);
  });
});
