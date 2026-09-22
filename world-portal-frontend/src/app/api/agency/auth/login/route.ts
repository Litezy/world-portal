import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction } from "@/config/env";
import { authenticateAgency } from "@/server/agency/auth";
import { AGENCY_SESSION_COOKIE } from "@/server/agency/session";
import { parseBody } from "@/server/http";
import { agencyLoginSchema } from "@/validations/agency";

/**
 * POST /api/agency/auth/login
 *
 * Passwordless OTP Login. Authenticates agency email & OTP, sets HTTP-only session cookie,
 * and returns the user object with the signed JWT token.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, agencyLoginSchema);
  if (response) return response;

  const result = await authenticateAgency(data.email, data.otp);
  if (!result.user || !result.token) {
    return NextResponse.json(
      { message: result.message ?? "Invalid or expired verification code." },
      { status: 401 },
    );
  }

  const maxAge = data.remember ? 60 * 60 * 24 * 7 : 60 * 60 * 8;

  const store = await cookies();
  store.set(AGENCY_SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge,
  });

  return NextResponse.json({
    data: {
      ...result.user,
      token: result.token,
    },
  });
}
