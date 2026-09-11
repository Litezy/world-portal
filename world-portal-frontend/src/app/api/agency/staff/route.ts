import { NextResponse } from "next/server";

import { pageOf } from "@/app/api/agency/_list";
import { requireAgencySession } from "@/app/api/agency/_session";
import { addStaff, listStaff } from "@/server/agency/store";
import { listParamsFrom, parseBody } from "@/server/http";
import { newStaffSchema } from "@/validations/agency";

/** GET /api/agency/staff — the agency's own people, filtered and paged. */
export async function GET(request: Request) {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const params = listParamsFrom(request);
  const staff = await listStaff(session.agencyId, params);

  return NextResponse.json(pageOf(staff, params.page, params.perPage));
}

/**
 * POST /api/agency/staff — add someone to the roster.
 *
 * The new person is attached to the session's agency. The body carries no
 * `agencyId`, and the schema would reject one if it did.
 */
export async function POST(request: Request) {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const body = await parseBody(request, newStaffSchema);
  if (body.response) return body.response;

  const staff = await addStaff(session.agencyId, body.data);
  return NextResponse.json(
    { data: staff, message: "Added to the roster" },
    { status: 201 },
  );
}
