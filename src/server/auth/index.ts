import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { backend, BackendError } from "@/server/api/backend";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";
import type { BackendProfile } from "@/server/data/backend-types";
import type { AdminUser } from "@/types";

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

export function profileToAdminUser(profile: BackendProfile): AdminUser {
  return {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`.trim() || profile.email,
    email: profile.email,
    role: profile.role,
  };
}

/**
 * Exchanges console credentials for a World Portal access token.
 *
 * Authorisation is the service's, not ours: the token is only useful if the
 * API has a matching active Profile, which `/profiles/me` proves. The shared
 * console password is a stop-gap that keeps a mock-auth deployment from being
 * open to anyone who knows a seeded email — drop it when the real identity
 * provider issues tokens directly.
 */
export async function authenticate(email: string, password: string) {
  const env = serverEnv();

  if (password !== env.ADMIN_PASSWORD) {
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
      return { user: null, token: null, message };
    }
    throw error;
  }
}
