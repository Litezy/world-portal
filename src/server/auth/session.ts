import { createHmac, timingSafeEqual } from "node:crypto";

import type { AdminUser } from "@/types";

export const SESSION_COOKIE = "wp_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** The console's cookie also carries the API token — it never reaches the browser. */
export type SessionPayload = AdminUser & { exp: number; token: string };

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(
  user: AdminUser & { token: string },
  secret: string,
  ttlSeconds = SESSION_TTL_SECONDS,
) {
  const payload: SessionPayload = {
    ...user,
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
    ) as SessionPayload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}
