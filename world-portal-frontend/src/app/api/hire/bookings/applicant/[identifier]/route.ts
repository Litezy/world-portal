import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;
    if (!identifier) return NextResponse.json([]);

    const clean = decodeURIComponent(identifier).trim();
    const encoded = encodeURIComponent(clean);

    const res = await fetch(`${BACKEND_API_URL}/hire/bookings/applicant/${encoded}`, {
      cache: "no-store",
    }).catch(() => null);

    const resData = res && res.ok ? await res.json().catch(() => null) : null;
    const bookings = Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData)
      ? resData
      : [];

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json([]);
  }
}
