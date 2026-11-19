import { NextResponse } from "next/server";

import { visitorIpHeaders } from "@/server/api/service-key";
import { applicantBackend } from "@/server/applicant/backend";
import { backendErrorResponse } from "@/server/http";

/**
 * POST /api/payments/checkout-package — open a payment for the basket, as the
 * signed-in WorldStreet applicant. The session token is forwarded and the API
 * files the basket under that account's verified email; any `email` in the
 * body is ignored there. Signed out, this is a 401 and the API is not called.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await applicantBackend<unknown>("/payments/checkout-package", {
      method: "POST",
      body: JSON.stringify(body),
      // The API rate-limits this per visitor (by their IP) rather than per
      // this server's address, which every visitor's checkout shares.
      service: true,
      headers: visitorIpHeaders(request),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
