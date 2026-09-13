import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";
import { assignStaff, completeAssignment, getAssignment } from "@/server/agency/store";
import { parseBody } from "@/server/http";
import { assignmentActionSchema } from "@/validations/agency";

/**
 * GET /api/agency/assignments/[id]
 *
 * The id in the path names an assignment, never an agency. `getAssignment()`
 * takes the session's agency id as well, so another agency's reference resolves
 * to nothing here rather than to somebody else's traveller.
 */
export async function GET(
  _: Request,
  ctx: RouteContext<"/api/agency/assignments/[id]">,
) {
  const { session, response } = await requireAgencySession();
  if (response) return response;
  const { id } = await ctx.params;

  const assignment = await getAssignment(session.agencyId, id);
  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ data: assignment });
}

/**
 * PATCH /api/agency/assignments/[id]
 *
 * Both moves an agency can make on an assignment live here, discriminated on
 * `action` — putting names against it, and closing it out. A second endpoint
 * would differ only in its verb, and the store refuses each one for its own
 * reasons anyway (wrong status, too few staff, staff who are not theirs), which
 * come back as a 422 carrying the store's own wording.
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/agency/assignments/[id]">,
) {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const body = await parseBody(request, assignmentActionSchema);
  if (body.response) return body.response;
  const { id } = await ctx.params;

  const result =
    body.data.action === "assign"
      ? await assignStaff(session.agencyId, id, body.data.staffIds)
      : await completeAssignment(session.agencyId, id);

  if (!result.assignment) {
    return NextResponse.json(
      { message: result.message ?? "That change was not accepted." },
      { status: 422 },
    );
  }

  return NextResponse.json({ data: result.assignment, message: result.message });
}
