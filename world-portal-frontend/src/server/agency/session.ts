import { createHmac, timingSafeEqual } from "node:crypto";

import type { AgencyUser } from "@/features/agency/types";

/**
 * The agency console's session cookie.
 *
 * **This is a deliberate duplicate of `src/server/auth/session.ts`, and it is
 * not to be "dried up".** The two consoles are two audiences: `/admin` is
 * E-Embassy staff and `/agency` is an outside business. Keeping one signer,
 * one cookie name and one payload shape per side is what makes it structurally
 * impossible for an admin cookie to authenticate an agency or the reverse —
 * `src/proxy.ts` reads each with only its own verifier. A shared helper would
 * put that guarantee one careless parameter away from being lost, and the
 * admin file is covered by `src/server/__tests__/session.test.ts`, which this
 * change was not allowed to disturb. If you ever do merge them, the cookie
 * name and an audience claim must stay distinct and both test suites must pass.
 *
 * One real difference from the admin payload: the admin cookie also carries
 * the World Portal access token, because its console is a BFF for a real API.
 * There is no agency API, so **this payload carries no token** — there is
 * nothing for it to hold, and adding one later means adding it here only.
 */

export const AGENCY_SESSION_COOKIE = "wp_agency_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AgencySessionPayload = AgencyUser & { exp: number };

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAgencySessionToken(
  user: AgencyUser,
  secret: string,
  ttlSeconds = SESSION_TTL_SECONDS,
) {
  const payload: AgencySessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${sign(body, secret)}`, maxAge: ttlSeconds };
}

export function verifyAgencySessionToken(
  token: string | undefined,
  secret: string,
): AgencySessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const received = Buffer.from(signature);
  // The length check is load-bearing: timingSafeEqual throws on a mismatch
  // rather than returning false, and a thrown error here is a 500, not a 401.
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<AgencySessionPayload>;

    // Both consoles sign with the same SESSION_SECRET, so a valid signature is
    // not on its own proof that this cookie was minted for an agency: an admin
    // payload pasted into the agency cookie would pass the HMAC. It carries no
    // `agencyId`, and every read in the store is scoped by one — so an agency
    // session without an agency is refused here rather than reaching the store
    // as `undefined` and matching nothing (or, one refactor later, everything).
    if (typeof payload.agencyId !== "string" || payload.agencyId === "") return null;
    if (typeof payload.exp !== "number") return null;

    return payload.exp > Math.floor(Date.now() / 1000)
      ? (payload as AgencySessionPayload)
      : null;
  } catch {
    return null;
  }
}
