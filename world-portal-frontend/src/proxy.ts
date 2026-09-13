import { type NextRequest, NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import {
  AGENCY_SESSION_COOKIE,
  verifyAgencySessionToken,
} from "@/server/agency/session";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";

const ADMIN_LOGIN_PATH = "/admin/login";
const AGENCY_LOGIN_PATH = "/agency/login";

/** The only two `/agency/*` paths reachable without an agency session. */
const AGENCY_PUBLIC_PATHS = new Set<string>([AGENCY_LOGIN_PATH, "/agency/signup"]);

/** `/admin` and `/admin/...`, but never `/administration`. */
function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Two consoles, two sessions, two independent guards.
 *
 * The separation below is deliberate and load-bearing. `/admin` is staff at
 * E-Embassy; `/agency` is a third-party business that must never see another
 * agency's assignments, let alone the admin desk. So each branch reads only
 * its own cookie and verifies it with only its own verifier: an admin cookie
 * cannot authenticate `/agency/*` and an agency cookie cannot authenticate
 * `/admin/*`, because neither branch ever looks at the other's cookie. Dispatch
 * once, here, and return from the branch — do not merge them into one
 * "is there any session" check, and do not let one fall through into the other.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isUnder(pathname, "/agency")) return guardAgency(request);
  if (isUnder(pathname, "/admin")) return guardAdmin(request);

  // Unreachable through `config.matcher`; here so a widened matcher fails open
  // on unrelated paths rather than bouncing them to one of the two logins.
  return NextResponse.next();
}

/** The console. Unchanged in behaviour — only moved into its own function. */
function guardAdmin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    serverEnv().SESSION_SECRET,
  );

  if (pathname === ADMIN_LOGIN_PATH) {
    return session
      ? NextResponse.redirect(new URL("/admin", request.url))
      : NextResponse.next();
  }

  if (!session) {
    const url = new URL(ADMIN_LOGIN_PATH, request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/** The agency dashboard. Same shape as the admin branch, its own cookie. */
function guardAgency(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = verifyAgencySessionToken(
    request.cookies.get(AGENCY_SESSION_COOKIE)?.value,
    serverEnv().SESSION_SECRET,
  );

  // Sign-in *and* sign-up are public: an agency that has not listed yet has no
  // session by definition, so guarding /agency/signup would make listing
  // impossible. Both bounce a signed-in agency to the dashboard, exactly as
  // /admin/login does.
  if (AGENCY_PUBLIC_PATHS.has(pathname)) {
    return session
      ? NextResponse.redirect(new URL("/agency", request.url))
      : NextResponse.next();
  }

  if (!session) {
    const url = new URL(AGENCY_LOGIN_PATH, request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/agency/:path*"],
};
