import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";
import { consultants } from "@/server/data/consultants";
import type { AdminUser } from "@/types";

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(
    store.get(SESSION_COOKIE)?.value,
    serverEnv().SESSION_SECRET,
  );
}

/** Route-handler guard. Returns the user, or the 401 response to send back. */
export async function requireSession() {
  const session = await getSession();
  if (session) return { session, response: null };
  return {
    session: null,
    response: NextResponse.json({ message: "Sign in to continue" }, { status: 401 }),
  };
}

export function authenticate(email: string, password: string): AdminUser | null {
  const env = serverEnv();
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) return null;
  const owner = consultants[0]!;
  return { ...owner, email, role: "admin" };
}
