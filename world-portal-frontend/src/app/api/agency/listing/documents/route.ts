import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";
import { setDocument } from "@/server/agency/store";
import { parseBody } from "@/server/http";
import { setDocumentSchema } from "@/validations/agency";

/**
 * PATCH /api/agency/listing/documents — record one uploaded document.
 *
 * The file itself is uploaded first and this only files the result against the
 * agency's compliance record, one `kind` at a time — the same two-step the visa
 * flow uses (`POST /upload`, then the `*Url` field). One document per call,
 * because each is reviewed, expires and can be rejected on its own.
 */
export async function PATCH(request: Request) {
  const { session, response } = await requireAgencySession();
  if (response) return response;

  const body = await parseBody(request, setDocumentSchema);
  if (body.response) return body.response;

  const { kind, ...file } = body.data;

  const agency = await setDocument(session.agencyId, kind, file);
  if (!agency) {
    return NextResponse.json({ message: "Agency not found" }, { status: 404 });
  }

  return NextResponse.json({ data: agency, message: "Document uploaded" });
}
