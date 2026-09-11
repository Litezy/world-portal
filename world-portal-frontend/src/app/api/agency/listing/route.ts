import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { requireAgencySession } from "@/app/api/agency/_session";
import { getAgency, updateListing } from "@/server/agency/store";
import { parseBody } from "@/server/http";
import { listingPatchSchema } from "@/validations/agency";

/**
 * GET /api/agency/listing — the agency's own record.
 *
 * "Own" is the whole point: there is no `/api/agency/[id]/listing`, because a
 * route shaped that way invites a handler that reads the id from the path. The
 * only listing reachable here is the one the cookie names.
 */
export async function GET() {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const agency = await getAgency(session.agencyId);
  if (!agency) {
    return NextResponse.json({ message: "Agency not found" }, { status: 404 });
  }

  return NextResponse.json({ data: agency });
}

/**
 * PATCH /api/agency/listing — save a step of the listing.
 *
 * The listing is built a step at a time, so every field is optional and an
 * absent key means "leave it alone" rather than "clear it".
 */
export async function PATCH(request: Request) {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const body = await parseBody(request, listingPatchSchema);
  if (body.response) return body.response;

  // A service the agency has only just added has no id yet — the client mints
  // one for row identity, but it is the server that decides what an offering is
  // called, so anything arriving without one is named here rather than trusted
  // to have named itself. `AgencyServiceOffering.id` is required downstream.
  const { offerings, ...rest } = body.data;
  const patch = offerings
    ? { ...rest, offerings: offerings.map((o) => ({ ...o, id: o.id ?? randomUUID() })) }
    : rest;

  const agency = await updateListing(session.agencyId, patch);
  if (!agency) {
    return NextResponse.json({ message: "Agency not found" }, { status: 404 });
  }

  return NextResponse.json({ data: agency, message: "Listing saved" });
}
