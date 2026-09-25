import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

import { clerkMiddleware } from "@clerk/nextjs/server";

import {
  isApplicantProtectedPath,
  WORLDSTREET_SIGN_IN_URL,
  WORLDSTREET_SIGN_UP_URL,
} from "@/config/auth";
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
 * Three audiences, three independent guards.
 *
 * The separation below is deliberate and load-bearing. `/admin` is staff at
 * E-Embassy; `/agency` is a third-party business that must never see another
 * agency's assignments, let alone the admin desk. So each branch reads only
 * its own cookie and verifies it with only its own verifier: an admin cookie
 * cannot authenticate `/agency/*` and an agency cookie cannot authenticate
 * `/admin/*`, because neither branch ever looks at the other's cookie. Dispatch
 * once, here, and return from the branch — do not merge them into one
 * "is there any session" check, and do not let one fall through into the other.
 *
 * Applicants are the third audience. They sign in on WorldStreet, whose Clerk
 * session this app shares, so every other path runs through Clerk. The two
 * consoles and their `/api` proxies never do: their sessions are their own,
 * and a WorldStreet session grants nothing there.
 */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (isUnder(pathname, "/agency")) return guardAgency(request);
  if (isUnder(pathname, "/admin")) return guardAdmin(request);
  if (isUnder(pathname, "/api/agency") || isUnder(pathname, "/api/admin")) {
    // Console proxies authenticate themselves (requireSession /
    // requireAgencySession) — the same as before this app knew about Clerk.
    return NextResponse.next();
  }

  return guardApplicant(request, event);
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

/**
 * Applicants: the WorldStreet session. Public unless the path is on the
 * applicant allowlist in `config/auth.ts`; a signed-out visitor to one of
 * those is sent to WorldStreet's sign-in with `redirect_url` back here.
 */
const guardApplicant = clerkMiddleware(
  async (auth, request) => {
    if (isApplicantProtectedPath(request.nextUrl.pathname)) {
      await auth.protect();
    }
  },
  { signInUrl: WORLDSTREET_SIGN_IN_URL, signUpUrl: WORLDSTREET_SIGN_UP_URL },
);

export const config = {
  matcher: [
    // Every page, skipping Next internals and static files — a static asset
    // missing from this list would get a sign-in redirect instead of the file.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|mp4|webm|txt|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
