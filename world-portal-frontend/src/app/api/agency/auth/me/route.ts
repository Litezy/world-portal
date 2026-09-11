import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";

/** GET /api/agency/auth/me — the signed-in agency user, or a 401. */
export async function GET() {
  const { session, response } = await requireAgencySession();
  if (response) return response;
  // `exp` is a cookie mechanic; the client has no business with it.
  const { exp: _exp, ...user } = session;
  return NextResponse.json({ data: user });
}
