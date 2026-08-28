import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { consultants } from "@/server/data";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  return NextResponse.json({ data: consultants });
}
