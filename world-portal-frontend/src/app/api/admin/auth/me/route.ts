import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { toClientUser } from "@/server/auth/client-user";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  return NextResponse.json({ data: toClientUser(session) });
}
