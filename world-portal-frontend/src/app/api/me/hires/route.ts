import { NextResponse } from "next/server";

import { BackendError } from "@/server/api/backend";
import { applicantBackend } from "@/server/applicant/backend";

/** The signed-in applicant's hire bookings, newest first. */
export async function GET() {
  try {
    const bookings = await applicantBackend<unknown[]>("/me/hires");
    return NextResponse.json(Array.isArray(bookings) ? bookings : []);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Could not load bookings.";
    return NextResponse.json({ message }, { status });
  }
}
