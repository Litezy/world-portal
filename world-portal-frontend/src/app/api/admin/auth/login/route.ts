import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction, serverEnv } from "@/config/env";
import { authenticate } from "@/server/auth";
import { createSessionToken, SESSION_COOKIE } from "@/server/auth/session";
import { backendErrorResponse, parseBody } from "@/server/http";
import { loginSchema } from "@/validations/auth";

export async function POST(request: Request) {
  const { data, response } = await parseBody(request, loginSchema);
  if (response) return response;

  try {
    const result = await authenticate(data.email, data.password);
    if (!result.user || !result.token) {
      return NextResponse.json({ message: result.message }, { status: 401 });
    }

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
    return backendErrorResponse(error);
  }
}
