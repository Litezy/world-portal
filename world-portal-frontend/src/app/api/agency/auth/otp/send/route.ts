import { NextResponse } from "next/server";

import { sendAgencyOtp } from "@/server/agency/auth";
import { parseBody } from "@/server/http";
import { agencySendOtpSchema } from "@/validations/agency";

/**
 * POST /api/agency/auth/otp/send
 *
 * Validates requested email against database (if intent is login/signup) and sends OTP code.
 */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, agencySendOtpSchema);
  if (response) return response;

  const result = await sendAgencyOtp(data.email, data.intent);
  if (!result.success) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status || 400 },
    );
  }

  return NextResponse.json({ message: result.message });
}
