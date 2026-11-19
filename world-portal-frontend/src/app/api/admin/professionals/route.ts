import { NextResponse } from "next/server";

import { z } from "zod";

import { backend } from "@/server/api/backend";
import { DESK_ROLES, requireRole } from "@/server/auth";
import { byDate, byText, listResponse, type ListSpec } from "@/server/data/list";
import { backendErrorResponse, parseBody, readListParams } from "@/server/http";

const categorySchema = z.string().trim().max(60).optional();

const verifySchema = z.object({ isVerified: z.boolean() });

const professionalIdSchema = z.string().trim().min(1).max(120);

/** The whole directory in one request — the service sets no upper bound on `limit`. */
const FETCH_LIMIT = 500;

type ProfessionalRow = {
  id: string;
  name: string;
  title: string;
  category: string;
  bio?: string | null;
  // The service's profile has a country but no city.
  country: string;
  isVerified: boolean;
  createdAt: string;
};

const spec: ListSpec<ProfessionalRow> = {
  statusOf: (pro) => (pro.isVerified ? "verified" : "unverified"),
  dateOf: (pro) => pro.createdAt,
  sorters: {
    name: byText((pro) => pro.name),
    createdAt: byDate((pro) => pro.createdAt),
  },
  defaultSort: { key: "createdAt", dir: "desc" },
  csv: {
    filename: "professionals",
    columns: [
      { header: "Name", value: (pro) => pro.name },
      { header: "Title", value: (pro) => pro.title },
      { header: "Category", value: (pro) => pro.category },
      { header: "Country", value: (pro) => pro.country },
      { header: "Verified", value: (pro) => (pro.isVerified ? "Yes" : "No") },
    ],
  },
};

/**
 * The service's admin list ignores `search` and `category` (it only pages),
 * so the console's filters used to do nothing. The whole directory is read
 * once and filtered, counted and paged here, like every other console list.
 */
export async function GET(request: Request) {
  const { session, response } = await requireRole(DESK_ROLES);
  if (response) return response;

  const { params, response: invalid } = readListParams(request);
  if (invalid) return invalid;
  const category = categorySchema.safeParse(
    new URL(request.url).searchParams.get("category") ?? undefined,
  );
  if (!category.success) {
    return NextResponse.json({ message: "Invalid filters" }, { status: 422 });
  }

  try {
    const result = await backend<{ data: ProfessionalRow[] }>(
      "/hire/professionals/admin",
      {
        token: session.token,
        query: { limit: FETCH_LIMIT },
      },
    );
    const q = params.q?.toLowerCase();
    const rows = result.data.filter(
      (pro) =>
        (!category.data || pro.category === category.data) &&
        (!q ||
          [pro.name, pro.title, pro.country, pro.bio].some((field) =>
            (field ?? "").toLowerCase().includes(q),
          )),
    );
    return listResponse(rows, params, spec);
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const { session, response } = await requireRole(DESK_ROLES);
  if (response) return response;

  const id = professionalIdSchema.safeParse(
    new URL(request.url).searchParams.get("id"),
  );
  if (!id.success) {
    return NextResponse.json(
      { message: "Professional ID is required" },
      { status: 400 },
    );
  }

  const body = await parseBody(request, verifySchema);
  if (body.response) return body.response;

  try {
    const result = await backend<unknown>(
      `/hire/professionals/${encodeURIComponent(id.data)}/verify`,
      { method: "PATCH", token: session.token, body: JSON.stringify(body.data) },
    );
    return NextResponse.json({ data: result, message: "Verification updated" });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
