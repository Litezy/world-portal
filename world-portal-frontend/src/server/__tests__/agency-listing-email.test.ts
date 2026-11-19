import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAgency, updateListing } from "@/server/agency/store";
import { listingPatchSchema } from "@/validations/agency";

/**
 * An agency signs in with the email on its listing. Letting the listing form
 * change that email would let whoever holds a session move the account to an
 * address nobody verified, so the listing update never carries one: changing
 * a sign-in email needs a verified flow, which doesn't exist yet.
 */

const cookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "wp_agency_session" && cookie.value
        ? { value: cookie.value }
        : undefined,
  }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockRejectedValue(new Error("offline"));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The body of the listing PATCH the store sent to the API. */
function sentListingPatch(): Record<string, unknown> {
  const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/listing"));
  expect(call, "expected a listing PATCH").toBeTruthy();
  return JSON.parse(String((call![1] as RequestInit).body));
}

describe("the listing email can't be changed through the listing", () => {
  it("the patch schema drops an email", () => {
    const parsed = listingPatchSchema.parse({
      email: "attacker@example.com",
      phone: "+15550100",
    });
    expect(parsed).not.toHaveProperty("email");
    expect(parsed).toMatchObject({ phone: "+15550100" });
  });

  it("the store never sends one, or applies one locally", async () => {
    const { agency } = createAgency({
      agencyName: "Listing Email Agency",
      contactName: "Owner",
      email: "owner@listing-email.test",
      phone: "+15550100",
      countryCode: "GB",
      country: "United Kingdom",
    });

    const updated = await updateListing(agency.id, {
      summary: "Updated summary for the listing",
      email: "attacker@example.com",
    } as Parameters<typeof updateListing>[1]);

    expect(sentListingPatch()).not.toHaveProperty("email");
    expect(sentListingPatch()).toMatchObject({
      summary: "Updated summary for the listing",
    });
    expect(updated?.email).toBe("owner@listing-email.test");
  });

  it("PATCH /api/agency/listing drops an email from the body", async () => {
    const { createAgencySessionToken } = await import("@/server/agency/session");
    const { agency, user } = createAgency({
      agencyName: "Route Email Agency",
      contactName: "Owner",
      email: "owner@route-email.test",
      phone: "+15550100",
      countryCode: "GB",
      country: "United Kingdom",
    });
    cookie.value = createAgencySessionToken(
      user,
      "world-portal-dev-session-secret",
    ).token;
    const { PATCH } = await import("@/app/api/agency/listing/route");

    const response = await PATCH(
      new Request("http://localhost:3000/api/agency/listing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "attacker@example.com", phone: "+15550199" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(sentListingPatch()).not.toHaveProperty("email");
    const body = await response.json();
    expect(body.data.email).toBe("owner@route-email.test");
    expect(agency.id).toBe(body.data.id);
  });
});
