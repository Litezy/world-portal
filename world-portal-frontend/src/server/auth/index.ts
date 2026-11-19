import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/config/env";
import { backend, BackendError } from "@/server/api/backend";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";
import type { BackendProfile } from "@/server/data/backend-types";
import type { AdminRole, AdminUser } from "@/types";

/** Console roles that work the desk. Partners are external and never see it. */
export const DESK_ROLES = ["MANAGER", "STAFF"] as const satisfies readonly AdminRole[];

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(
    store.get(SESSION_COOKIE)?.value,
    serverEnv().SESSION_SECRET,
  );
}

/** Route-handler guard. Returns the session, or the 401 response to send back. */
export async function requireSession() {
  const session = await getSession();
  if (session) return { session, response: null };
  return {
    session: null,
    response: NextResponse.json({ message: "Sign in to continue" }, { status: 401 }),
  };
}

/**
 * Route-handler guard for routes the service itself leaves unguarded (agency
 * and professional management). 401 without a session, 403 when the role is
 * not one of `roles` — the console must not be the only thing standing
 * between a partner account and another business's verification status.
 */
export async function requireRole(roles: readonly AdminRole[]) {
  const result = await requireSession();
  if (result.response) return result;
  if (!roles.includes(result.session.role)) {
    return {
      session: null,
      response: NextResponse.json(
        { message: "Your role can't open this. Ask a manager for access." },
        { status: 403 },
      ),
    };
  }
  return result;
}

export function profileToAdminUser(profile: BackendProfile): AdminUser {
  return {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`.trim() || profile.email,
    email: profile.email,
    role: profile.role,
  };
}

/**
 * Whether `provided` is the console password, in constant time.
 *
 * `!==` stops at the first differing character, so how long a wrong guess
 * takes says how much of it was right. Both sides are hashed first: SHA-256
 * digests are always 32 bytes, so `timingSafeEqual` (which throws on a length
 * mismatch) can compare them without the length itself leaking.
 */
function consolePasswordMatches(provided: string, expected: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

export type AuthenticateResult =
  | { user: AdminUser; token: string; message: null; unavailable?: undefined }
  | {
      user: null;
      token: null;
      message: string;
      /** The service could not answer, so the credentials were never judged. */
      unavailable?: true;
    };

/**
 * Exchanges console credentials for a World Portal access token.
 *
 * Authorisation is the service's, not ours: the token is only useful if the
 * API has a matching active Profile, which `/profiles/me` proves. The shared
 * console password is a stop-gap that keeps a mock-auth deployment from being
 * open to anyone who knows a seeded email — drop it when the real identity
 * provider issues tokens directly.
 *
 * `visitor` (from `visitorIpHeaders()`) goes on the token request, so the
 * API's rate limit counts the visitor rather than this server's one address.
 */
export async function authenticate(
  email: string,
  password: string,
  visitor: Record<string, string> = {},
): Promise<AuthenticateResult> {
  const env = serverEnv();

  if (!consolePasswordMatches(password, env.ADMIN_PASSWORD)) {
    return {
      user: null,
      token: null,
      message: "That email and password do not match.",
    };
  }

  try {
    const issued = await backend<{ accessToken: string }>("/auth/test-token", {
      method: "POST",
      body: JSON.stringify({ email }),
      // The service only issues console tokens to holders of SERVICE_AUTH_KEY.
      service: true,
      headers: visitor,
    });

    const profile = await backend<BackendProfile>("/profiles/me", {
      token: issued.accessToken,
    });

    if (!profile.isActive) {
      return { user: null, token: null, message: "That account is deactivated." };
    }

    return {
      user: profileToAdminUser(profile),
      token: issued.accessToken,
      message: null,
    };
  } catch (error) {
    if (error instanceof BackendError) {
      // 404 from /profiles/me means the address has no account on the service.
      const message =
        error.status === 404
          ? "No E-Embassy account matches that email."
          : error.message;
      // An outage or the API's own rate limit is not a verdict on the visitor.
      if (error.status >= 500 || error.status === 429) {
        return { user: null, token: null, message, unavailable: true };
      }
      return { user: null, token: null, message };
    }
    throw error;
  }
}
