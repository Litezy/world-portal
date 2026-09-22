import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendPassportApplication } from "@/server/data/backend-types";
import { toPassportApplication } from "@/server/data/mappers";
import { backendErrorResponse, parseBody } from "@/server/http";
import { evaluateVisaSchema } from "@/validations/admin";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/passports/[id]/evaluate">,
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await parseBody(request, evaluateVisaSchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;

  try {
    const record = await backend<BackendPassportApplication>(
      `/passport-application/${encodeURIComponent(id)}/evaluate`,
      { method: "PATCH", token: session.token, body: JSON.stringify(body.data) },
    );
    return NextResponse.json({
      data: toPassportApplication(record),
      message: "Cost evaluated",
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/passports/[id]/evaluate">,
) {
  return POST(request, ctx);
}
