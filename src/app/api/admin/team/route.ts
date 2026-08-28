import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendProfile } from "@/server/data/backend-types";
import { toTeamMember } from "@/server/data/mappers";
import { backendErrorResponse } from "@/server/http";

/** Manager-only on the service; a non-manager gets its 403 verbatim. */
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const profiles = await backend<BackendProfile[]>("/profiles", {
      token: session.token,
    });
    return NextResponse.json({ data: profiles.map(toTeamMember) });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
