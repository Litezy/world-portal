import { NextResponse } from "next/server";

import { z } from "zod";

import { BackendError } from "@/server/api/backend";
import { listParamsSchema } from "@/validations/admin";

export function listParamsFrom(request: Request) {
  const url = new URL(request.url);
  return listParamsSchema.parse(Object.fromEntries(url.searchParams));
}

export async function parseBody<T extends z.ZodType>(request: Request, schema: T) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return {
      data: null,
      response: NextResponse.json({ message: "Invalid JSON body" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      data: null,
      response: NextResponse.json(
        { message: "Please check the highlighted fields.", errors: fieldErrors },
        { status: 422 },
      ),
    };
  }
  return { data: parsed.data as z.infer<T>, response: null };
}

/** Surface the API's own status and field errors rather than a blanket 500. */
export function backendErrorResponse(error: unknown) {
  if (error instanceof BackendError) {
    return NextResponse.json(
      { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
      { status: error.status },
    );
  }
  throw error;
}

/** The API returns whole collections, so the console pages them itself. */
export function paginate<T>(items: T[], page = 1, perPage = 10) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    meta: { page: safePage, perPage, total, totalPages },
  };
}
