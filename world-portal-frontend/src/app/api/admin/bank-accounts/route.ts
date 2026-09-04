import { NextResponse } from "next/server";
import { z } from "zod";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import { backendErrorResponse, parseBody } from "@/server/http";

const createBankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  routingNumber: z.string().optional(),
  currency: z.string().default("USD"),
  instructions: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const bankAccounts = await backend<any[]>("/bank-accounts", {
      token: session.token,
    });
    return NextResponse.json({ data: bankAccounts });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { data, response: bodyResponse } = await parseBody(request, createBankAccountSchema);
  if (bodyResponse) return bodyResponse;

  try {
    const bankAccount = await backend<any>("/bank-accounts", {
      method: "POST",
      token: session.token,
      body: JSON.stringify(data),
    });

    return NextResponse.json({ success: true, data: bankAccount });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
