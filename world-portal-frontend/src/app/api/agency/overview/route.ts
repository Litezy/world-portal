import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";
import { getOverview } from "@/server/agency/store";

/** GET /api/agency/overview — the dashboard's headline figures. */
export async function GET() {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  // Scoped by the cookie's agency id and nothing else.
  const overview = await getOverview(session.agencyId);
  return NextResponse.json({
    data: overview ?? {
      openAssignments: 0,
      staffOnDuty: 0,
      staffTotal: 0,
      completedThisMonth: 0,
      earnedThisMonth: 0,
      pendingPayout: 0,
      currency: "USD",
      outstandingDocuments: 0,
      verification: "unverified",
      listingStatus: "draft",
    },
  });
}
