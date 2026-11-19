import { NextResponse } from "next/server";

import { z } from "zod";

import { backend } from "@/server/api/backend";
import { requireRole } from "@/server/auth";
import type { BackendProfile } from "@/server/data/backend-types";
import { toTeamMember } from "@/server/data/mappers";
import { backendErrorResponse, parseBody } from "@/server/http";

const MANAGER_ONLY = ["MANAGER"] as const;

const updateSchema = z
  .object({
    role: z.enum(["MANAGER", "STAFF", "PARTNER"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((body) => body.role !== undefined || body.isActive !== undefined, {
    message: "Nothing to change",
  });

/**
 * Change a member's role or reactivate them. The service refuses (409) a
 * manager demoting themselves or the last manager — its message is passed
 * straight through for the console to show (ADR 0016).
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/team/[id]">,
) {
  const { session, response } = await requireRole(MANAGER_ONLY);
  if (response) return response;

  const body = await parseBody(request, updateSchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;

  try {
    const profile = await backend<BackendProfile>(
      `/profiles/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        token: session.token,
        body: JSON.stringify(body.data),
      },
    );
    return NextResponse.json({ data: toTeamMember(profile) });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

/** Deactivate (the service's DELETE is a soft delete: `isActive: false`). */
export async function DELETE(_: Request, ctx: RouteContext<"/api/admin/team/[id]">) {
  const { session, response } = await requireRole(MANAGER_ONLY);
  if (response) return response;
  const { id } = await ctx.params;

  try {
    const profile = await backend<BackendProfile>(
      `/profiles/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        token: session.token,
      },
    );
    return NextResponse.json({ data: toTeamMember(profile) });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
