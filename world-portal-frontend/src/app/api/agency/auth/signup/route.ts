import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction } from "@/config/env";
import { registerAgency } from "@/server/agency/auth";
import {
  AGENCY_SESSION_COOKIE,
  AGENCY_SESSION_TTL_SECONDS,
} from "@/server/agency/session";
import { visitorIpHeaders } from "@/server/api/service-key";
import { parseBody } from "@/server/http";
import { agencySignupSchema } from "@/validations/agency";

/**
 * POST /api/agency/auth/signup
 *
 * Passwordless OTP Signup. Verifies OTP, creates the agency, sets the httpOnly
 * session cookie and returns the user. Never the token: in the body, page
 * scripts could read what the cookie keeps from them.
 *
 * "Already listed" (409) is said only after the code is verified, so only the
 * mailbox's owner can learn that an agency holds the email.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, agencySignupSchema);
  if (response) return response;

  // One lifetime for both the cookie and the signed session inside it.
  const maxAge = AGENCY_SESSION_TTL_SECONDS;

  const result = await registerAgency(data, visitorIpHeaders(request), {
    ttlSeconds: maxAge,
  });
  if (!result.user || !result.token) {
    const isConflict = result.message?.includes("already listed");
    return NextResponse.json(
      { message: result.message ?? "Could not complete registration." },
      { status: isConflict ? 409 : 400 },
    );
  }

  const store = await cookies();
  store.set(AGENCY_SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge,
  });

  return NextResponse.json({ data: result.user }, { status: 201 });
}
