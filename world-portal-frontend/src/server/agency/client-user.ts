import type { ClientAgencyUser } from "@/features/agency/types";
import type { AgencySessionPayload } from "@/server/agency/session";

/**
 * The agency session, cut down to what the UI shows. The agency cookie carries
 * no token today; copying fields by name means one added later still stays on
 * the server. Kept apart from `toClientUser` for the same reason the two
 * session files are (see `session.ts`).
 */
export function toClientAgencyUser(session: AgencySessionPayload): ClientAgencyUser {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    agencyId: session.agencyId,
    agencyName: session.agencyName,
  };
}
