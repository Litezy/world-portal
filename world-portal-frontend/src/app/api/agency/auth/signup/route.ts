import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction } from "@/config/env";
import { registerAgency } from "@/server/agency/auth";
import { AGENCY_SESSION_COOKIE } from "@/server/agency/session";
import { parseBody } from "@/server/http";
import { agencySignupSchema } from "@/validations/agency";

/**
 * POST /api/agency/auth/signup
 *
 * Passwordless OTP Signup. Verifies OTP, creates agency in DB, sets HTTP-only session cookie,
 * and returns the user object with the signed JWT token.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, agencySignupSchema);
  if (response) return response;

  const result = await registerAgency(data);
  if (!result.user || !result.token) {
    const isConflict = result.message?.includes("already listed");
    return NextResponse.json(
      { message: result.message ?? "Could not complete registration." },
      { status: isConflict ? 409 : 400 },
    );
  }

  const maxAge = 60 * 60 * 24 * 7;

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
  }, { status: 201 });
}
