import { NextResponse } from "next/server";

import { z } from "zod";

import { BackendError } from "@/server/api/backend";
import { listParamsSchema } from "@/validations/admin";

const INVALID_FILTERS = "Those filters aren't valid. Clear the search and try again.";

/** Thrown by `listParamsFrom`; `backendErrorResponse` turns it into a 422. */
export class InvalidListParamsError extends Error {
  readonly status = 422;
  constructor() {
    super(INVALID_FILTERS);
    this.name = "InvalidListParamsError";
  }
}

/**
 * Parses `q`, `status`, `page`, `perPage`, returning the 422 to send back when
 * they are unusable — an oversized or malformed value is the caller's mistake,
 * not a server error. Same shape as `parseBody`.
 */
export function readListParams(request: Request) {
  const url = new URL(request.url);
  const parsed = listParamsSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return {
      params: null,
      response: NextResponse.json({ message: INVALID_FILTERS }, { status: 422 }),
    };
  }
  return { params: parsed.data, response: null };
}

/** Throwing variant for callers that parse inside their own try/catch. */
export function listParamsFrom(request: Request) {
  const { params } = readListParams(request);
  if (!params) throw new InvalidListParamsError();
  return params;
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
  if (error instanceof InvalidListParamsError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
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
