import { createHmac, timingSafeEqual } from "node:crypto";

import { userRoleValues } from "@/server/data/backend-types";
import type { AdminUser } from "@/types";

export const SESSION_COOKIE = "wp_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Who this cookie was minted for. The agency console signs its cookie with the
 * same SESSION_SECRET, so a valid signature alone does not prove the cookie is
 * an admin one: an agency could paste its own cookie into `wp_admin_session`.
 * The agency payload says `"agency"`, and this verifier accepts only `"admin"`.
 */
const AUDIENCE = "admin";

/** The console's cookie also carries the API token — it never reaches the browser. */
export type SessionPayload = AdminUser & { exp: number; token: string };

/** What is actually signed: the session plus its audience. */
type SignedSession = SessionPayload & { aud: typeof AUDIENCE };

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(
  user: AdminUser & { token: string },
  secret: string,
  ttlSeconds = SESSION_TTL_SECONDS,
) {
  const payload: SignedSession = {
    ...user,
    // After the spread, so nothing the caller passes can change the audience.
    aud: AUDIENCE,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${sign(body, secret)}`, maxAge: ttlSeconds };
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<SignedSession>;

    // A cookie minted before the audience existed has none, and is refused:
    // everyone signs in again once.
    if (payload.aud !== AUDIENCE) return null;
    // Every console call forwards the access token, and every guard reads the
    // role. A payload without either is not a console session.
    if (typeof payload.token !== "string" || payload.token === "") return null;
    if (!(userRoleValues as readonly unknown[]).includes(payload.role)) return null;
    if (typeof payload.exp !== "number") return null;

    return payload.exp > Math.floor(Date.now() / 1000)
      ? (payload as SessionPayload)
      : null;
  } catch {
    return null;
  }
}
