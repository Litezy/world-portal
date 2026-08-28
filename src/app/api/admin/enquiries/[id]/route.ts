import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { getEnquiry, updateEnquiry } from "@/server/data";
import { notFound, parseBody } from "@/server/http";
import { updateEnquirySchema } from "@/validations/admin";

export async function GET(_: Request, ctx: RouteContext<"/api/admin/enquiries/[id]">) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await ctx.params;
  const enquiry = getEnquiry(id);
  return enquiry ? NextResponse.json({ data: enquiry }) : notFound("Enquiry");
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/enquiries/[id]">,
) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await parseBody(request, updateEnquirySchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;
  const updated = updateEnquiry(id, {
    ...(body.data.status ? { status: body.data.status } : {}),
    ...(body.data.assigneeId !== undefined
      ? { assigneeId: body.data.assigneeId ?? undefined }
      : {}),
  });
  return updated
    ? NextResponse.json({ data: updated, message: "Enquiry updated" })
    : notFound("Enquiry");
}
