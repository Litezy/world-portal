import type { BasketItem } from "@/features/basket/store";

/** The signed-in applicant placing the booking, as their WorldStreet session has them. */
export type BookingApplicant = { displayName: string; email: string | null };

const THREE_DAYS_MS = 86_400_000 * 3;

/**
 * The body checkout posts to `/api/hire/bookings` for one professional in the basket.
 *
 * No amount, currency or profile: the API prices the booking from the
 * professional's own listing and files it under the WorldStreet session, and
 * ignores those fields if they are sent. The basket's price is what the
 * traveller was shown, not what they are charged.
 */
export function hireBookingRequest(
  item: BasketItem,
  applicant: BookingApplicant,
  now: number = Date.now(),
) {
  return {
    professionalId: item.id.replace(/^pro:/, ""),
    travellerName: applicant.displayName,
    // The API files the booking under the WorldStreet session and its
    // verified email; this is only the form's required field.
    travellerEmail: applicant.email ?? "",
    destinationCity: item.city || "Destination",
    startsAt: new Date(now).toISOString(),
    endsAt: new Date(now + THREE_DAYS_MS).toISOString(),
  };
}
