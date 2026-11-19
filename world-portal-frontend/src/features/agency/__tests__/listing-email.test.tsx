import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { Form } from "@/components/ui/form";
import { agencyListing } from "@/content/agency";
import {
  type ListingFormValues,
  toPatch,
} from "@/features/agency/components/listing/form";
import { ProfileStep } from "@/features/agency/components/listing/profile-step";

/**
 * The listing's email is the agency's sign-in email. Until there is a verified
 * way to change it, the listing shows it read-only and never sends it.
 */
const VALUES: ListingFormValues = {
  name: "Shield Security",
  legalName: "Shield Security Ltd",
  registrationNumber: "",
  countryCode: "GB",
  country: "United Kingdom",
  cities: ["London"],
  categories: [],
  summary: "Close protection",
  about: "A sample agency for this test.",
  email: "owner@agency.test",
  phone: "+15550100",
  website: "",
  yearFounded: 2020,
  staffCount: 4,
  languages: ["English"],
  offerings: [],
};

function Harness() {
  const form = useForm<ListingFormValues>({ defaultValues: VALUES });
  return (
    <Form {...form}>
      <ProfileStep form={form} disabled={false} />
    </Form>
  );
}

describe("the listing's email", () => {
  it("is read-only, with a note to contact support", () => {
    render(<Harness />);

    const email = screen.getByLabelText(new RegExp(agencyListing.profile.email));
    expect(email).toHaveValue("owner@agency.test");
    expect(email).toHaveAttribute("readonly");
    expect(screen.getByText(agencyListing.profile.emailLocked)).toBeInTheDocument();
  });

  it("is never part of what the listing saves", () => {
    expect(toPatch(VALUES)).not.toHaveProperty("email");
    expect(toPatch(VALUES)).toMatchObject({ phone: "+15550100" });
  });
});
