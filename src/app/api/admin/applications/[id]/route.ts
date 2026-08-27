import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { advanceApplication, getApplication } from "@/server/data";
import { notFound, parseBody } from "@/server/http";
import { updateApplicationSchema } from "@/validations/admin";

export async function GET(
  _: Request,
  ctx: RouteContext<"/api/admin/applications/[id]">,
) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await ctx.params;
  const application = getApplication(id);
  return application
    ? NextResponse.json({ data: application })
    : notFound("Application");
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/applications/[id]">,
) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await parseBody(request, updateApplicationSchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;
  const updated = advanceApplication(id, body.data.status, body.data.note || undefined);
  return updated
    ? NextResponse.json({ data: updated, message: "Application updated" })
    : notFound("Application");
}
