import { NextResponse } from "next/server";

import { z } from "zod";

import { backend } from "@/server/api/backend";
import { requireRole } from "@/server/auth";
import { backendErrorResponse, parseBody } from "@/server/http";

const updateBankAccountSchema = z.object({
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  routingNumber: z.string().optional(),
  currency: z.string().optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

/** The id stays one path segment: a `/` or `?` in it can't reach another route. */
const accountPath = (id: string) => `/bank-accounts/${encodeURIComponent(id)}`;

/**
 * Managers only: a changed account number silently redirects applicants'
 * payments, so changing or deleting an account needs the manager role here
 * as well as on the service.
 */
export async function PATCH(request: Request, context: Context) {
  const { session, response } = await requireRole(["MANAGER"]);
  if (response) return response;

  const { id } = await context.params;
  const { data, response: bodyResponse } = await parseBody(
    request,
    updateBankAccountSchema,
  );
  if (bodyResponse) return bodyResponse;

  try {
    const bankAccount = await backend<unknown>(accountPath(id), {
      method: "PATCH",
      token: session.token,
      body: JSON.stringify(data),
    });

    return NextResponse.json({ success: true, data: bankAccount });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { session, response } = await requireRole(["MANAGER"]);
  if (response) return response;

  const { id } = await context.params;

  try {
    const deleted = await backend<unknown>(accountPath(id), {
      method: "DELETE",
      token: session.token,
    });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
