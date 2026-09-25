import { NextResponse } from "next/server";

import { BackendError } from "@/server/api/backend";
import { applicantBackend } from "@/server/applicant/backend";

/**
 * Places a hire booking as the signed-in WorldStreet applicant. The API files
 * it under their account; without a session this is a 401.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const booking = await applicantBackend<unknown>("/hire/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
