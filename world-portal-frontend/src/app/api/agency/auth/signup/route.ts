import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction, serverEnv } from "@/config/env";
import { registerAgency } from "@/server/agency/auth";
import {
  AGENCY_SESSION_COOKIE,
  createAgencySessionToken,
} from "@/server/agency/session";
import { parseBody } from "@/server/http";
import { agencySignupSchema } from "@/validations/agency";

/**
 * POST /api/agency/auth/signup
 *
 * Registers the agency and signs it straight in, so the new owner lands on the
 * dashboard rather than on a login form asking for the password they typed
 * twenty seconds ago.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, agencySignupSchema);
  if (response) return response;

  // `confirmPassword` is a form concern, never part of `RegisterAgencyInput`.
  const { confirmPassword: _confirmPassword, ...input } = data;

  const result = await registerAgency(input);
  if (!result.user) {
    // The only thing the store refuses a well-formed registration for is an
    // address that already has an account — a conflict, not a bad request.
    return NextResponse.json(
      { message: result.message ?? "An account already exists for that email." },
      { status: 409 },
    );
  }

  const { token, maxAge } = createAgencySessionToken(
    result.user,
    serverEnv().SESSION_SECRET,
  );

  const store = await cookies();
  store.set(AGENCY_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge,
  });

  return NextResponse.json({ data: result.user }, { status: 201 });
}
