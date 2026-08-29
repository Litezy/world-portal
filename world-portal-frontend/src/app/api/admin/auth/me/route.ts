import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const { exp: _exp, token: _token, ...user } = session;
  return NextResponse.json({ data: user });
}
