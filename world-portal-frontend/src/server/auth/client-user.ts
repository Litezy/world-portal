import type { SessionPayload } from "@/server/auth/session";
import type { ClientAdminUser } from "@/types";

/**
 * The console session, cut down to what the UI shows.
 *
 * The session also carries the World Portal access token, and anything handed
 * to a client component is serialized into the page. So this copies the
 * fields the UI needs by name rather than removing the ones it must not have:
 * a field added to the session later stays on the server until someone adds
 * it here on purpose.
 */
export function toClientUser(session: SessionPayload): ClientAdminUser {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    ...(session.avatar ? { avatar: session.avatar } : {}),
  };
}
