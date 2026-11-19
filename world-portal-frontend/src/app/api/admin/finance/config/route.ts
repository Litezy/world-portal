import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireRole } from "@/server/auth";
import type { BackendPaymentConfig } from "@/server/data/backend-types";
import { backendErrorResponse, parseBody } from "@/server/http";
import { feeConfigSchema } from "@/validations/admin";

/** Save the fee settings — manager only, as on the service. */
export async function PATCH(request: Request) {
  const { session, response } = await requireRole(["MANAGER"]);
  if (response) return response;

  const body = await parseBody(request, feeConfigSchema);
  if (body.response) return body.response;

  try {
    const config = await backend<BackendPaymentConfig>("/payments/config", {
      method: "PATCH",
      token: session.token,
      body: JSON.stringify(body.data),
    });
    return NextResponse.json({ data: config, message: "Fee settings saved" });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
