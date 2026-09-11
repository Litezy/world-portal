import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction, serverEnv } from "@/config/env";
import { authenticateAgency } from "@/server/agency/auth";
import {
  AGENCY_SESSION_COOKIE,
  createAgencySessionToken,
} from "@/server/agency/session";
import { parseBody } from "@/server/http";
import { agencyLoginSchema } from "@/validations/agency";

/**
 * POST /api/agency/auth/login
 *
 * The agency portal is a BFF exactly like the console: the browser only ever
 * talks to these same-origin handlers, and the session is an httpOnly cookie
 * it cannot read. Note that `backendErrorResponse()` has no use anywhere under
 * `/api/agency` — there is no World Portal agency service behind these yet, so
 * nothing here can throw a `BackendError`; everything is served from
 * `src/server/agency/store.ts`. Reach for it when that seam is swapped for a
 * real API.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, agencyLoginSchema);
  if (response) return response;

  const result = await authenticateAgency(data.email, data.password);
  if (!result.user) {
    return NextResponse.json(
      { message: result.message ?? "That email and password do not match." },
      { status: 401 },
    );
  }

  // Same TTL rule as the console: a session lasts a week only if asked for,
  // otherwise it dies with the working day.
  const { token, maxAge } = createAgencySessionToken(
    result.user,
    serverEnv().SESSION_SECRET,
    data.remember ? undefined : 60 * 60 * 8,
  );

  const store = await cookies();
  store.set(AGENCY_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge,
  });

  return NextResponse.json({ data: result.user });
}
