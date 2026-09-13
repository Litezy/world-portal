import { NextResponse } from "next/server";

import { pageOf } from "@/app/api/agency/_list";
import { requireAgencySession } from "@/app/api/agency/_session";
import { listPayouts } from "@/server/agency/store";
import { listParamsFrom } from "@/server/http";

/**
 * GET /api/agency/payouts — what the platform has settled and still owes.
 *
 * Money, so the tenancy rule matters most here: the agency id comes from the
 * session cookie, never from the request.
 */
export async function GET(request: Request) {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const params = listParamsFrom(request);
  const payouts = await listPayouts(session.agencyId, params);

  return NextResponse.json(pageOf(payouts, params.page, params.perPage));
}
