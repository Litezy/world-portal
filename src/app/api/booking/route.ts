import { NextResponse } from "next/server";

import { z } from "zod";

import { bookingSchema } from "@/validations/booking";

/**
 * Stub endpoint so the booking form works end to end today. Swap the body for
 * a real mail/CRM call — the response shape is what the client already expects.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    // Flatten to { field: [message] } so the client can map errors onto inputs.
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

  // Prefix by service so the reference tells a consultant what it is at a glance.
  const prefix = { visa: "WPV", booking: "WPB", experience: "WPE" }[
    parsed.data.service
  ];
  const reference = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  console.info("[booking] enquiry received", {
    reference,
    service: parsed.data.service,
    destination: parsed.data.destination,
  });

  return NextResponse.json({ data: { reference }, message: "Enquiry received" });
}
