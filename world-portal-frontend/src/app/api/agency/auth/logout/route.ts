import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AGENCY_SESSION_COOKIE } from "@/server/agency/session";

/** POST /api/agency/auth/logout — drops the cookie; nothing else to undo. */
export async function POST() {
  const store = await cookies();
  store.delete(AGENCY_SESSION_COOKIE);
  return NextResponse.json({ data: { ok: true } });
}
