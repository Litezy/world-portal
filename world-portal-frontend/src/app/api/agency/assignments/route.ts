import { NextResponse } from "next/server";

import { pageOf } from "@/app/api/agency/_list";
import { requireAgencySession } from "@/app/api/agency/_session";
import { listAssignments } from "@/server/agency/store";
import { listParamsFrom } from "@/server/http";

/**
 * GET /api/agency/assignments — the bookings this agency has to staff.
 *
 * The query string carries search, status and paging. It does **not** carry an
 * agency id, and this handler would ignore one if it did: tenancy comes from
 * the session cookie, because an assignment holds a traveller's name, contact
 * details and what they paid.
 */
export async function GET(request: Request) {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const params = listParamsFrom(request);
  const assignments = await listAssignments(session.agencyId, params);

  return NextResponse.json(pageOf(assignments, params.page, params.perPage));
}
