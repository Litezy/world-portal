import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { visitorIpHeaders } from "@/server/api/service-key";
import { backendErrorResponse, parseBody } from "@/server/http";
import { otpVerifySchema } from "@/validations/otp";

export async function POST(request: Request) {
  // Checked and rebuilt rather than relayed raw: this call carries the
  // service key, so the API trusts it more than it would the browser.
  const { data, response } = await parseBody(request, otpVerifySchema);
  if (response) return response;

  try {
    // Relayed for this visitor: the key plus their IP lets the API rate-limit
    // each visitor instead of this server's one address.
    const result = await backend<unknown>("/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email: data.email, code: data.code }),
      service: true,
      headers: visitorIpHeaders(request),
    });
    // The answer carries the lookup token /track needs; it goes back as is.
    return NextResponse.json(result);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
