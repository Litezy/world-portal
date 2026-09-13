import { serverEnv } from "@/config/env";
import type { AgencyUser } from "@/features/agency/types";
import { createAgency, findAgencyUserByEmail } from "@/server/agency/store";

/**
 * Agency sign-in and sign-up — **a mock, and only a mock.**
 *
 * There is no agency identity provider and no agency API. Everything here
 * compares a shared `AGENCY_PASSWORD` against a fixture roster, exactly the
 * stop-gap the admin console runs on (`authenticate()` in
 * `src/server/auth/index.ts`) and with exactly the same shelf life: it keeps a
 * demo deployment from being open to anyone who guesses a seeded email, and it
 * is not authentication. **Replace it before a single real business signs in.**
 * That means per-account credentials, hashed and salted, an email
 * verification step, and proof that the person signing up is authorised to act
 * for the company they are claiming.
 *
 * Two consequences worth stating out loud:
 *
 * - The password chosen at sign-up is **discarded**. Nothing here stores
 *   credentials, so the account signs in afterwards with the shared
 *   `AGENCY_PASSWORD` like every other fixture agency.
 * - Error messages never say whether it was the email or the password that
 *   was wrong. That is not politeness — it is what stops the form being used
 *   to enumerate which businesses are listed.
 */

export function authenticateAgency(
  email: string,
  password: string,
): { user: AgencyUser | null; message: string | null } {
  const env = serverEnv();
  const user = findAgencyUserByEmail(email);

  // Both branches answer identically on purpose: see the note above.
  if (!user || password !== env.AGENCY_PASSWORD) {
    return { user: null, message: "That email and password do not match." };
  }

  return { user, message: null };
}

export type RegisterAgencyInput = {
  agencyName: string;
  contactName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  /** Collected by the form, and deliberately not stored — see above. */
  password: string;
};

/**
 * Creates a listing in `draft` / `unverified`, with the checklist every agency
 * owes already seeded as `missing`, and returns the person to sign in as.
 *
 * `async` because a real implementation will be: it has to reach a service,
 * hash a password and send a verification email. Keeping the signature honest
 * now means the call sites do not all change later.
 */
export async function registerAgency(
  input: RegisterAgencyInput,
): Promise<{ user: AgencyUser | null; message: string | null }> {
  const email = input.email.trim();

  if (findAgencyUserByEmail(email)) {
    return {
      user: null,
      message: "An agency is already listed with that email. Sign in instead.",
    };
  }

  const { user } = createAgency({
    agencyName: input.agencyName.trim(),
    contactName: input.contactName.trim(),
    email,
    phone: input.phone.trim(),
    countryCode: input.countryCode.trim().toUpperCase(),
    country: input.country.trim(),
  });

  return { user, message: null };
}
