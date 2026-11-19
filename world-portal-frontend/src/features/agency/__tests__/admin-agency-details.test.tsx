import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "@/components/ui/dialog";
import { AgencyDetails } from "@/features/agency/components/admin-agencies-table";
import type { Agency } from "@/features/agency/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/agencies",
  useSearchParams: () => new URLSearchParams(),
}));

/** An agency as the admin desk reviews it; the links are the agency's own. */
function agencyWith(overrides: Partial<Agency>): Agency {
  return {
    id: "ag-1",
    slug: "shield-security",
    name: "Shield Security",
    legalName: "Shield Security Ltd",
    registrationNumber: "RC-0001",
    countryCode: "GB",
    country: "United Kingdom",
    cities: ["London"],
    categories: ["security"],
    summary: "Close protection",
    about: "A sample agency for this test.",
    logoUrl: null,
    email: "owner@agency.test",
    phone: "+440000000",
    website: null,
    yearFounded: 2020,
    staffCount: 4,
    languages: ["English"],
    verification: "pending",
    listingStatus: "submitted",
    documents: [],
    offerings: [],
    rating: null,
    completedJobs: 0,
    createdAt: "2026-11-01T00:00:00.000Z",
    commissionRate: 0.15,
    ...overrides,
  };
}

function renderDetails(agency: Agency) {
  return render(
    <Dialog open>
      <AgencyDetails
        agency={agency}
        onApprove={() => {}}
        onReject={() => {}}
        onDecide={() => {}}
      />
    </Dialog>,
  );
}

describe("AgencyDetails (admin)", () => {
  it("links an https website", () => {
    renderDetails(agencyWith({ website: "https://shield.example" }));
    expect(screen.getByRole("link", { name: /shield\.example/ })).toHaveAttribute(
      "href",
      "https://shield.example/",
    );
  });

  it.each(["javascript:alert(document.cookie)", "http://shield.example"])(
    "does not link a %s website",
    (website) => {
      renderDetails(agencyWith({ website }));
      expect(screen.queryByRole("link", { name: /shield|javascript/i })).toBeNull();
      expect(document.body.innerHTML).not.toContain(`href="${website}`);
      expect(screen.getByText(/link unavailable/i)).toBeInTheDocument();
    },
  );

  it("does not frame a document whose file isn't https", () => {
    renderDetails(
      agencyWith({
        categories: ["security"],
        documents: [
          {
            kind: "business_registration",
            status: "uploaded",
            fileName: "reg.pdf",
            fileUrl: "javascript:alert(1)",
          },
        ],
      }),
    );
    expect(screen.queryByRole("button", { name: /view document/i })).toBeNull();
    expect(screen.getAllByText(/link unavailable/i).length).toBeGreaterThan(0);
  });
});
