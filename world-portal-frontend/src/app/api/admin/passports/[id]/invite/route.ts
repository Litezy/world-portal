import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { DESK_ROLES, requireRole } from "@/server/auth";
import type { BackendPassportApplication } from "@/server/data/backend-types";
import { toPassportApplication } from "@/server/data/mappers";
import { backendErrorResponse, parseBody } from "@/server/http";
import { inviteApplicantSchema } from "@/validations/admin";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/passports/[id]/invite">,
) {
  const { session, response } = await requireRole(DESK_ROLES);
  if (response) return response;

  const body = await parseBody(request, inviteApplicantSchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;

  try {
    const record = await backend<BackendPassportApplication>(
      `/passport-application/${encodeURIComponent(id)}/invite`,
      { method: "POST", token: session.token, body: JSON.stringify(body.data) },
    );
    return NextResponse.json({
      data: toPassportApplication(record),
      message: "Applicant invitation sent",
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
