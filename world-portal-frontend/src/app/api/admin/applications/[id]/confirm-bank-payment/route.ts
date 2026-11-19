import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { DESK_ROLES, requireRole } from "@/server/auth";
import { backendErrorResponse, parseBody } from "@/server/http";
import { confirmBankPaymentSchema } from "@/validations/admin";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { session, response } = await requireRole(DESK_ROLES);
  if (response) return response;

  const { id } = await context.params;
  const { data, response: bodyResponse } = await parseBody(
    request,
    confirmBankPaymentSchema,
  );
  if (bodyResponse) return bodyResponse;

  try {
    const result = await backend<unknown>("/payments/bank-transfer/confirm", {
      method: "POST",
      token: session.token,
      body: JSON.stringify({
        visaDocumentationId: id,
        ...data,
      }),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
