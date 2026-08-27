import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { getDashboardStats, recentEnquiries } from "@/server/data";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  return NextResponse.json({
    data: { stats: getDashboardStats(), recent: recentEnquiries(5) },
  });
}
