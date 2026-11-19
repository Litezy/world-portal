import { createHmac } from "node:crypto";

import { serverEnv } from "@/config/env";

const KEY_LENGTH = 24;

/**
 * An opaque, stable handle for an applicant. There is no customer table, so
 * an applicant is "everyone who applied with this email" — but the email must
 * never appear in a URL (it ends up in history, logs and referrers). This is
 * an HMAC of it under the session secret: stable across requests, useless
 * without the secret. Rotating `SESSION_SECRET` changes every key, so old
 * customer links stop resolving — the lists still work.
 */
export function customerKey(email: string) {
  return createHmac("sha256", serverEnv().SESSION_SECRET)
    .update(`customer:${email.trim().toLowerCase()}`)
    .digest("base64url")
    .slice(0, KEY_LENGTH);
}

export function isCustomerKey(value: string) {
  return value.length === KEY_LENGTH && /^[A-Za-z0-9_-]+$/.test(value);
}
