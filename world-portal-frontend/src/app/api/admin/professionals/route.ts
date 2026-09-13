import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const url = new URL(`${BACKEND_API_URL}/hire/professionals/admin`);
    searchParams.forEach((value, key) => url.searchParams.set(key, value));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 1 } });
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 1 } });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ message: "Professional ID is required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_API_URL}/hire/professionals/${id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ message: "Failed to update professional verification status" }, { status: 400 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
