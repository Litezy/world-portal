import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { backendErrorResponse } from "@/server/http";

export async function GET() {
  try {
    const activeBankAccounts = await backend<any[]>("/bank-accounts/public/active");
    return NextResponse.json({ data: activeBankAccounts });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
