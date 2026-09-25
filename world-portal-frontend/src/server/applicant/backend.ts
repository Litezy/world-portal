import { auth } from "@clerk/nextjs/server";

import { backend, BackendError } from "@/server/api/backend";

/**
 * The signed-in applicant's WorldStreet session token, or null when signed
 * out. The World Portal API verifies it against WorldStreet's Clerk instance
 * and reads the applicant from its subject — this app never names the user.
 */
export async function applicantToken(): Promise<string | null> {
  const { userId, getToken } = await auth();
  if (!userId) return null;
  return getToken();
}

/**
 * `backend()` as the signed-in applicant. Throws a 401 `BackendError` when
 * there is no WorldStreet session, so route handlers can map it like any
 * other upstream failure.
 */
export async function applicantBackend<T>(
  path: string,
  init: Parameters<typeof backend>[1] = {},
): Promise<T> {
  const token = await applicantToken();
  if (!token) {
    throw new BackendError("Sign in with your WorldStreet account to continue.", 401);
  }
  return backend<T>(path, { ...init, token });
}
