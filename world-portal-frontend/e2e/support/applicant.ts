import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { type Page, test } from "@playwright/test";

/**
 * Signs a page in as a WorldStreet test applicant.
 *
 * `/apply`, `/passport` and `/applicant` need a WorldStreet (Clerk) session.
 * Tests reach one through Clerk's testing helpers against WorldStreet's Clerk
 * *development* instance, which needs, in the environment:
 *
 *   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY  (dev instance, pk_test_/sk_test_)
 *   E2E_CLERK_USER_EMAIL                                 (an existing user in that instance)
 *
 * Without them the signed-in tests skip with that reason rather than fail.
 */
const email = process.env.E2E_CLERK_USER_EMAIL;
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const hasTestApplicant = Boolean(
  email && process.env.CLERK_SECRET_KEY && publishableKey?.startsWith("pk_test_"),
);

export const SKIP_WITHOUT_APPLICANT =
  "needs a WorldStreet test applicant: E2E_CLERK_USER_EMAIL plus the dev instance's Clerk keys";

let setup: Promise<void> | null = null;

export async function signInAsApplicant(page: Page) {
  test.skip(!hasTestApplicant, SKIP_WITHOUT_APPLICANT);
  setup ??= clerkSetup({ publishableKey });
  await setup;
  // Clerk must be loaded on a public page before it can sign in.
  await page.goto("/start");
  await clerk.signIn({ page, emailAddress: email! });
}
