import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendVisaApplication } from "@/server/data/backend-types";
import { toVisaApplication } from "@/server/data/mappers";
import { backendErrorResponse, parseBody } from "@/server/http";
import { updateVisaStatusSchema } from "@/validations/admin";

export async function GET(
  _: Request,
  ctx: RouteContext<"/api/admin/applications/[id]">,
) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await ctx.params;

  try {
    const record = await backend<BackendVisaApplication>(
      `/visa-documentation/${encodeURIComponent(id)}`,
      { token: session.token },
    );
    return NextResponse.json({ data: toVisaApplication(record) });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/applications/[id]">,
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await parseBody(request, updateVisaStatusSchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;

  try {
    const record = await backend<BackendVisaApplication>(
      `/visa-documentation/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        token: session.token,
        body: JSON.stringify(body.data),
      },
    );
    return NextResponse.json({
      data: toVisaApplication(record),
      message: "Application updated",
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
