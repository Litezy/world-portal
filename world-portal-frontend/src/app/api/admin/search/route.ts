import { NextResponse } from "next/server";

import { z } from "zod";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type {
  BackendPassportApplication,
  BackendVisaApplication,
} from "@/server/data/backend-types";
import {
  toCustomers,
  toPassportApplication,
  toVisaApplication,
} from "@/server/data/mappers";
import { backendErrorResponse } from "@/server/http";
import type { AdminSearchResults } from "@/types";

const querySchema = z.object({ q: z.string().trim().min(2).max(80) });

/** Enough to choose from; the full lists are one click away. */
const LIMIT = 5;

/**
 * Global console search: one query, three groups. The service's own `search`
 * filter does the matching on applications (name, email, reference, passport
 * number); applicants are grouped from those same results.
 */
export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Type at least two characters to search." },
      { status: 422 },
    );
  }
  const { q } = parsed.data;

  try {
    const [visaRecords, passportRecords] = await Promise.all([
      backend<BackendVisaApplication[]>("/visa-documentation", {
        token: session.token,
        query: { search: q },
      }),
      backend<BackendPassportApplication[]>("/passport-application", {
        token: session.token,
        query: { search: q },
      }),
    ]);

    const visas = visaRecords.map(toVisaApplication);
    const passports = passportRecords.map(toPassportApplication);
    const needle = q.toLowerCase();

    const results: AdminSearchResults = {
      visas: visas.slice(0, LIMIT).map((v) => ({
        id: v.id,
        reference: v.reference,
        name: v.applicant.name,
        status: v.status,
      })),
      passports: passports.slice(0, LIMIT).map((p) => ({
        id: p.id,
        reference: p.reference,
        name: p.applicant.name,
        status: p.status,
      })),
      applicants: toCustomers(visas, passports)
        .filter(
          (c) =>
            c.name.toLowerCase().includes(needle) ||
            c.email.toLowerCase().includes(needle),
        )
        .slice(0, LIMIT)
        .map((c) => ({ name: c.name, applications: c.applications })),
    };

    return NextResponse.json({ data: results });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
