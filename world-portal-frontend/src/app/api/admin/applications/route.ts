import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendVisaApplication } from "@/server/data/backend-types";
import { toVisaApplication } from "@/server/data/mappers";
import { backendErrorResponse, listParamsFrom, paginate } from "@/server/http";

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const params = listParamsFrom(request);
  try {
    // Search and status are the service's own filters; paging is ours.
    const records = await backend<BackendVisaApplication[]>("/visa-documentation", {
      token: session.token,
      query: { search: params.q, status: params.status },
    });
    return NextResponse.json(
      paginate(records.map(toVisaApplication), params.page, params.perPage),
    );
  } catch (error) {
    return backendErrorResponse(error);
  }
}
