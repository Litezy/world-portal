import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";
import { listingReadiness, submitListing } from "@/server/agency/store";

/**
 * POST /api/agency/listing/submit — hand the listing to review.
 *
 * Readiness is checked here rather than trusted from the client, because the
 * paperwork a category demands is decided by `documentsForCategories()` and a
 * stale browser tab can be a category behind. A listing that is not ready comes
 * back as a 422 naming the documents still missing, so the UI can point at them
 * instead of saying "something went wrong".
 */
export async function POST() {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const readiness = await listingReadiness(session.agencyId);
  if (!readiness.ready) {
    return NextResponse.json(
      {
        message: "Some required documents are still missing.",
        missing: readiness.missing,
      },
      { status: 422 },
    );
  }

  const result = await submitListing(session.agencyId);
  if (!result.agency) {
    return NextResponse.json(
      { message: result.message ?? "That listing cannot be submitted yet." },
      { status: 422 },
    );
  }

  return NextResponse.json({ data: result.agency, message: result.message });
}
