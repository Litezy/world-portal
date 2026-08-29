import { NextResponse } from "next/server";

/** Uptime probe — deployment platforms and monitors hit this. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
