import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction } from "@/config/env";
import { authenticateAgency } from "@/server/agency/auth";
import {
  AGENCY_SESSION_COOKIE,
  AGENCY_SESSION_TTL_SECONDS,
  AGENCY_SHORT_SESSION_TTL_SECONDS,
} from "@/server/agency/session";
import { visitorIpHeaders } from "@/server/api/service-key";
import { parseBody } from "@/server/http";
import { agencyLoginSchema } from "@/validations/agency";

/**
 * POST /api/agency/auth/login
 *
 * Passwordless OTP Login. Authenticates agency email & OTP, sets the httpOnly
 * session cookie and returns the user. Never the token: in the body, page
 * scripts could read what the cookie keeps from them.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, agencyLoginSchema);
  if (response) return response;

  // One lifetime for both the cookie and the signed session inside it.
  const maxAge = data.remember
    ? AGENCY_SESSION_TTL_SECONDS
    : AGENCY_SHORT_SESSION_TTL_SECONDS;

  const result = await authenticateAgency(
    data.email,
    data.otp,
    visitorIpHeaders(request),
    { ttlSeconds: maxAge },
  );
  if (!result.user || !result.token) {
    return NextResponse.json(
      { message: result.message ?? "Invalid or expired verification code." },
      { status: 401 },
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

  return NextResponse.json({ data: result.user });
}
