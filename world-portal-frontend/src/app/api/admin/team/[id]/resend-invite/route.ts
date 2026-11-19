import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireRole } from "@/server/auth";
import { backendErrorResponse } from "@/server/http";

export async function POST(
  _: Request,
  ctx: RouteContext<"/api/admin/team/[id]/resend-invite">,
) {
  const { session, response } = await requireRole(["MANAGER"]);
  if (response) return response;
  const { id } = await ctx.params;

  try {
    const result = await backend<{ sent: boolean }>(
      `/profiles/${encodeURIComponent(id)}/resend-invite`,
      { method: "POST", token: session.token },
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
