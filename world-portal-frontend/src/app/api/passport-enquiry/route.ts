import { NextResponse } from "next/server";

import { z } from "zod";

import { passportEnquirySchema } from "@/validations/passport";

/**
 * The World Portal API has visa endpoints but no passport ones yet, so this
 * route handler stands in: it validates against the same schema the form uses
 * and returns a reference in the shape the client expects. When a real
 * passport endpoint lands, point the mutation at it and delete this file —
 * nothing else has to change.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = passportEnquirySchema.safeParse(payload);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return NextResponse.json(
      { message: "Please check the highlighted fields.", errors: fieldErrors },
      { status: 422 },
    );
  }

  // Honeypot tripped — accept silently so the bot learns nothing.
  if (parsed.data.website) {
    return NextResponse.json({ data: { reference: "OK" } }, { status: 202 });
  }

  const reference = `WPP-${Date.now().toString(36).toUpperCase()}`;
  console.info("[passport] enquiry received", {
    reference,
    applicationType: parsed.data.applicationType,
  });

  return NextResponse.json({ data: { reference } });
}
