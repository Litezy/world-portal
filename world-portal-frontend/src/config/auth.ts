import { env } from "@/config/env";

/**
 * Applicant identity comes from WorldStreet.
 *
 * E-Embassy is a WorldStreet service: it shares the parent platform's Clerk
 * instance, so anyone signed in on worldstreetgold.com is already signed in
 * here. There is no E-Embassy login page — signed-out applicants go to
 * WorldStreet's and are sent back with `redirect_url`.
 */
export const WORLDSTREET_URL = env.NEXT_PUBLIC_WORLDSTREET_URL;
export const WORLDSTREET_SIGN_IN_URL = env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
export const WORLDSTREET_SIGN_UP_URL = env.NEXT_PUBLIC_CLERK_SIGN_UP_URL;

/**
 * Pages that need a WorldStreet session. Everything else — the landing page,
 * the trip planner, services, hire browsing — stays public.
 */
export const APPLICANT_PROTECTED_PREFIXES = [
  "/applicant",
  "/apply",
  "/passport",
] as const;

/** `/apply` and `/apply/...`, but never `/applying`. */
export function isApplicantProtectedPath(pathname: string): boolean {
  return APPLICANT_PROTECTED_PREFIXES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

/**
 * WorldStreet's sign-in page, set to return to `returnTo` afterwards. A
 * relative `returnTo` is resolved against `origin` — the hub only redirects to
 * absolute URLs on its own allowlist.
 */
export function worldStreetSignInUrl(returnTo: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : env.NEXT_PUBLIC_SITE_URL);
  const url = new URL(WORLDSTREET_SIGN_IN_URL);
  url.searchParams.set("redirect_url", new URL(returnTo, base).toString());
  return url.toString();
}
