import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isProduction, serverEnv } from "@/config/env";
import { authenticate } from "@/server/auth";
import { createSessionToken, SESSION_COOKIE } from "@/server/auth/session";
import { parseBody } from "@/server/http";
import { loginSchema } from "@/validations/auth";

export async function POST(request: Request) {
  const { data, response } = await parseBody(request, loginSchema);
  if (response) return response;

  const user = authenticate(data.email, data.password);
  if (!user) {
    return NextResponse.json(
      { message: "That email and password do not match." },
      { status: 401 },
    );
  }

  const { token, maxAge } = createSessionToken(
    user,
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

  return NextResponse.json({ data: user });
}
