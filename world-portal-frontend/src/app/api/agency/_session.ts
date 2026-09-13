import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import {
  AGENCY_SESSION_COOKIE,
  type AgencySessionPayload,
  verifyAgencySessionToken,
} from "@/server/agency/session";

/**
 * The agency portal's session guard.
 *
 * It mirrors `requireSession()` in `src/server/auth/index.ts` rather than
 * reusing it: that one belongs to the admin console and reads the console's
 * cookie, which carries a World Portal access token and an `AdminRole`. An
 * agency signs in against a different cookie, a different secret payload and a
 * different set of rows, and collapsing the two would mean one console session
 * could read an agency's travellers — or the reverse.
 *
 * **`session.agencyId` is the only acceptable source of tenancy.** Every
 * handler under `/api/agency` scopes its query with it, and none of them read
 * an agency id from the path, the query string or the body. A handler that
 * trusted a client-supplied id would hand one agency another's travellers,
 * their contact details and their money — the ids are guessable and nothing
 * downstream re-checks them.
 */
export async function getAgencySession(): Promise<AgencySessionPayload | null> {
  const store = await cookies();
  return verifyAgencySessionToken(
    store.get(AGENCY_SESSION_COOKIE)?.value,
    serverEnv().SESSION_SECRET,
  );
}

type Guard =
  | { session: AgencySessionPayload; response: null }
  | { session: null; response: NextResponse };

/** Route-handler guard. Returns the session, or the 401 response to send back. */
export async function requireAgencySession(): Promise<Guard> {
  const session = await getAgencySession();
  if (session) return { session, response: null };
  return {
    session: null,
    response: NextResponse.json({ message: "Sign in to continue" }, { status: 401 }),
  };
}
