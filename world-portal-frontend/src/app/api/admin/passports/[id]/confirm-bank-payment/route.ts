import { NextResponse } from "next/server";
import { z } from "zod";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import { backendErrorResponse, parseBody } from "@/server/http";

const confirmBankPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  paymentOption: z.enum(["FULL", "HALF_INSTALLMENT"]),
  bankReference: z.string().optional(),
  notes: z.string().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await context.params;
  const { data, response: bodyResponse } = await parseBody(request, confirmBankPaymentSchema);
  if (bodyResponse) return bodyResponse;

  try {
    const result = await backend<any>("/payments/bank-transfer/confirm", {
      method: "POST",
      token: session.token,
      body: JSON.stringify({
        passportApplicationId: id,
        ...data,
      }),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
