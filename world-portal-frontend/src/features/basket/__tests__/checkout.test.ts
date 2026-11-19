import { describe, expect, it } from "vitest";

import { hireBookingRequest } from "@/features/basket/checkout";
import type { BasketItem } from "@/features/basket/store";

const item: BasketItem = {
  id: "pro:agency-ag-1",
  type: "pro",
  title: "Sample Guards",
  city: "Lisbon",
  price: 120,
  currency: "EUR",
};

const applicant = { displayName: "Sample Traveller", email: "traveller@example.com" };

describe("hireBookingRequest", () => {
  it("names the professional without the basket's namespace", () => {
    const body = hireBookingRequest(item, applicant, Date.UTC(2026, 11, 1));

    expect(body).toMatchObject({
      professionalId: "agency-ag-1",
      travellerName: "Sample Traveller",
      destinationCity: "Lisbon",
      startsAt: "2026-12-01T00:00:00.000Z",
      endsAt: "2026-12-04T00:00:00.000Z",
    });
  });

  // The API prices a booking from the professional's own listing and files it
  // under the WorldStreet session; it ignores an amount, a currency or a
  // profile sent from the browser, so checkout doesn't pretend to set them.
  it("leaves the price and the account to the server", () => {
    const body = hireBookingRequest(item, applicant);

    expect(body).not.toHaveProperty("totalAmount");
    expect(body).not.toHaveProperty("currency");
    expect(body).not.toHaveProperty("profileId");
  });
});
