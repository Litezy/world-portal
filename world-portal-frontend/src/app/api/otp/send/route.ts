import { NextResponse } from "next/server";
import { backend } from "@/server/api/backend";
import { backendErrorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await backend<any>("/otp/send", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(result);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
