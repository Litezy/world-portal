import { type NextRequest, NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";

const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    serverEnv().SESSION_SECRET,
  );

  if (pathname === LOGIN_PATH) {
    return session
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  if (!session) {
    const url = new URL(LOGIN_PATH, request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
