import { NextResponse } from "next/server";

import { z } from "zod";

import {
  listAgencies,
  updateAgencyDocumentStatus,
  updateAgencyVerification,
} from "@/server/agency/store";
import { DESK_ROLES, requireRole } from "@/server/auth";
import { parseBody } from "@/server/http";
import { rejectionNoteSchema } from "@/validations/admin";

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  verification: z.enum(["unverified", "pending", "verified", "suspended"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(6),
});

/** Either a document decision or an agency verification — never both. */
const patchSchema = z.union([
  z
    .object({
      docId: z.string().trim().min(1).max(120),
      docStatus: z.string().trim().min(1).max(40),
      note: z.string().trim().max(1000).optional(),
    })
    // A rejection without a reason leaves the agency guessing what to fix.
    .refine(
      (body) =>
        body.docStatus.toLowerCase() !== "rejected" ||
        rejectionNoteSchema.safeParse(body.note ?? "").success,
      { message: "Give the agency a reason of at least 10 characters", path: ["note"] },
    ),
  z
    .object({
      verification: z.string().trim().min(1).max(40).optional(),
      status: z.string().trim().min(1).max(40).optional(),
    })
    .refine((body) => Boolean(body.verification || body.status), {
      message: "Verification status is required",
      path: ["verification"],
    }),
]);

const agencyIdSchema = z.string().trim().min(1).max(120);

/**
 * Every call goes as the signed-in desk member (`session.token`), so the API
 * checks that member's role as well as this console. Verifying an agency and
 * ruling on a document take nothing else: the service key does not unlock them.
 */
export async function GET(request: Request) {
  const { session, response } = await requireRole(DESK_ROLES);
  if (response) return response;

  const query = listQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) {
    return NextResponse.json({ message: "Invalid filters" }, { status: 422 });
  }
  const { search, status, verification, page, perPage } = query.data;

  try {
    const paginated = await listAgencies(
      { q: search, status, verification, page, perPage },
      { token: session.token },
    );
    return NextResponse.json(paginated);
  } catch {
    // An outage must read as one — an empty list would claim there are no agencies.
    return NextResponse.json(
      { message: "Could not load agencies. Try again in a moment." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  const { session, response } = await requireRole(DESK_ROLES);
  if (response) return response;
  const desk = { token: session.token };

  const id = agencyIdSchema.safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) {
    return NextResponse.json({ message: "Agency ID is required" }, { status: 400 });
  }

  const body = await parseBody(request, patchSchema);
  if (body.response) return body.response;

  try {
    if ("docId" in body.data) {
      const updated = await updateAgencyDocumentStatus(
        id.data,
        body.data.docId,
        body.data.docStatus,
        body.data.note,
        desk,
      );
      return updated
        ? NextResponse.json({ data: updated, message: "Document status updated" })
        : NextResponse.json(
            { message: "Agency or document not found" },
            { status: 404 },
          );
    }

    const verification = (body.data.verification ?? body.data.status) as string;
    const updated = await updateAgencyVerification(id.data, verification, desk);
    return updated
      ? NextResponse.json({ data: updated, message: "Verification updated" })
      : NextResponse.json({ message: "Agency not found" }, { status: 404 });
  } catch {
    return NextResponse.json(
      { message: "Could not update the agency. Try again in a moment." },
      { status: 503 },
    );
  }
}
