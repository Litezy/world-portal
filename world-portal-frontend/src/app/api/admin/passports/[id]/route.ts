import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { DESK_ROLES, requireRole, requireSession } from "@/server/auth";
import type { BackendPassportApplication } from "@/server/data/backend-types";
import { toPassportApplication } from "@/server/data/mappers";
import { refuseIllegalMove } from "@/server/data/workflow-guard";
import { backendErrorResponse, parseBody } from "@/server/http";
import { updatePassportStatusSchema } from "@/validations/admin";

export async function GET(_: Request, ctx: RouteContext<"/api/admin/passports/[id]">) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await ctx.params;

  try {
    const record = await backend<BackendPassportApplication>(
      `/passport-application/${encodeURIComponent(id)}`,
      { token: session.token },
    );
    return NextResponse.json({ data: toPassportApplication(record) });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/passports/[id]">,
) {
  const { session, response } = await requireRole(DESK_ROLES);
  if (response) return response;

  const body = await parseBody(request, updatePassportStatusSchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;

  try {
    // The service accepts any stage from any stage until ADR 0017 lands.
    const current = await backend<BackendPassportApplication>(
      `/passport-application/${encodeURIComponent(id)}`,
      { token: session.token },
    );
    const refused = refuseIllegalMove(current.status, body.data.status);
    if (refused) return refused;

    const record = await backend<BackendPassportApplication>(
      `/passport-application/${encodeURIComponent(id)}/status`,
      { method: "PATCH", token: session.token, body: JSON.stringify(body.data) },
    );
    return NextResponse.json({
      data: toPassportApplication(record),
      message: "Application updated",
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
