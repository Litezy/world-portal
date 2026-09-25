import { NextResponse } from "next/server";

import { BackendError } from "@/server/api/backend";
import { applicantBackend } from "@/server/applicant/backend";

/**
 * The signed-in applicant's visa and passport applications, newest first.
 * Who is asking comes from the WorldStreet session, never from the URL.
 */
export async function GET() {
  try {
    const applications = await applicantBackend<unknown[]>("/me/applications");
    return NextResponse.json(Array.isArray(applications) ? applications : []);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not load applications.";
    return NextResponse.json({ message }, { status });
  }
}
