import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction, serverEnv } from "@/config/env";
import { visitorIpHeaders } from "@/server/api/service-key";
import { authenticate } from "@/server/auth";
import {
  beginSignIn,
  type SignInAttempt,
  signInNotJudged,
  signInSucceeded,
} from "@/server/auth/login-throttle";
import { createSessionToken, SESSION_COOKIE } from "@/server/auth/session";
import { backendErrorResponse, parseBody } from "@/server/http";
import { loginSchema } from "@/validations/auth";

/**
 * POST /api/admin/auth/login
 *
 * Failed attempts are limited per visitor address and per email
 * (`login-throttle.ts`); the address comes from the same trusted header the
 * API's own limits use (`visitorIpHeaders()`), and goes to the API on the
 * token request.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, loginSchema);
  if (response) return response;

  const visitor = visitorIpHeaders(request);
  const attempt: SignInAttempt = { ip: visitor["x-visitor-ip"], email: data.email };

  const blocked = beginSignIn(attempt);
  if (blocked) {
    const minutes = Math.ceil(blocked.retryAfterSeconds / 60);
    return NextResponse.json(
      {
        message: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfterSeconds) } },
    );
  }

  try {
    const result = await authenticate(data.email, data.password, visitor);
    if (!result.user || !result.token) {
      // A wrong password, an unknown or deactivated account stays counted.
      if (result.unavailable) signInNotJudged(attempt);
      return NextResponse.json({ message: result.message }, { status: 401 });
    }
    signInSucceeded(attempt);

    const { token, maxAge } = createSessionToken(
      { ...result.user, token: result.token },
      serverEnv().SESSION_SECRET,
      data.remember ? undefined : 60 * 60 * 8,
    );

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge,
    });

    return NextResponse.json({ data: result.user });
  } catch (error) {
    signInNotJudged(attempt);
    return backendErrorResponse(error);
  }
}
