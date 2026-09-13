import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_API_URL}/payments/checkout-package`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const err = await res.json();
    return NextResponse.json(err, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Backend payment service unavailable" },
      { status: 503 }
    );
  }
}
