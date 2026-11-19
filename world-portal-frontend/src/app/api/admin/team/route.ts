import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireRole, requireSession } from "@/server/auth";
import type { BackendProfile } from "@/server/data/backend-types";
import { toTeamMember } from "@/server/data/mappers";
import { backendErrorResponse, parseBody } from "@/server/http";
import { inviteMemberSchema } from "@/validations/admin";

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

export async function POST(request: Request) {
  const { session, response } = await requireRole(["MANAGER"]);
  if (response) return response;

  const { data, response: bodyResponse } = await parseBody(request, inviteMemberSchema);
  if (bodyResponse) return bodyResponse;

  try {
    const createdProfile = await backend<BackendProfile>("/profiles", {
      method: "POST",
      token: session.token,
      body: JSON.stringify({
        ...data,
        externalAuthId: `ext-${Date.now()}`,
      }),
    });

    return NextResponse.json({ success: true, data: toTeamMember(createdProfile) });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
