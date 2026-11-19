import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireRole } from "@/server/auth";
import type { BackendRefund } from "@/server/data/backend-types";
import { backendErrorResponse, parseBody } from "@/server/http";
import { refundSchema } from "@/validations/admin";

/**
 * Refund a confirmed transaction — manager only, as on the service. The
 * service applies the configured surcharge, marks the transaction and its
 * application refunded, and emails the applicant (ADR 0016).
 */
export async function POST(request: Request) {
  const { session, response } = await requireRole(["MANAGER"]);
  if (response) return response;

  const body = await parseBody(request, refundSchema);
  if (body.response) return body.response;

  try {
    const refund = await backend<BackendRefund>("/payments/refund", {
      method: "POST",
      token: session.token,
      body: JSON.stringify(body.data),
    });
    return NextResponse.json({ data: refund, message: "Refund processed" });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
