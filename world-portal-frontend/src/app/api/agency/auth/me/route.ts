import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";
import { toClientAgencyUser } from "@/server/agency/client-user";

/** GET /api/agency/auth/me — the signed-in agency user, or a 401. */
export async function GET() {
  const { session, response } = await requireAgencySession();
  if (response) return response;
  // The person, not the cookie's claims.
  return NextResponse.json({ data: toClientAgencyUser(session) });
}
