import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { listApplications } from "@/server/data";
import { listParamsFrom } from "@/server/http";

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  return NextResponse.json(listApplications(listParamsFrom(request)));
}
