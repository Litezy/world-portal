import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";
import { getOverview } from "@/server/agency/store";

/** GET /api/agency/overview — the dashboard's headline figures. */
export async function GET() {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  // Scoped by the cookie's agency id and nothing else.
  const overview = await getOverview(session.agencyId);
  if (!overview) {
    return NextResponse.json({ message: "Agency not found" }, { status: 404 });
  }

  return NextResponse.json({ data: overview });
}
