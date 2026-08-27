import { NextResponse } from "next/server";

import { z } from "zod";

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

export const notFound = (what: string) =>
  NextResponse.json({ message: `${what} not found` }, { status: 404 });
