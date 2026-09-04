import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendProfile } from "@/server/data/backend-types";
import { toTeamMember } from "@/server/data/mappers";
import { backendErrorResponse, parseBody } from "@/server/http";
import { z } from "zod";

const inviteSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["MANAGER", "STAFF", "PARTNER"]),
  phone: z.string().optional(),
});

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
  const { session, response } = await requireSession();
  if (response) return response;

  const { data, response: bodyResponse } = await parseBody(request, inviteSchema);
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
