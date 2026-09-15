import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipientId");
    if (!recipientId) {
      return NextResponse.json({ data: [], unreadCount: 0 });
    }

    const clean = decodeURIComponent(recipientId).trim().toLowerCase();
    const limit = searchParams.get("limit") || "30";

    const res = await fetch(
      `${BACKEND_API_URL}/notifications/${encodeURIComponent(clean)}?limit=${limit}`,
      { cache: "no-store" },
    ).catch(() => null);

    if (!res || !res.ok) {
      return NextResponse.json({ data: [], unreadCount: 0 });
    }

    const json = await res.json();
    const payload =
      json && typeof json === "object" && "data" in json && json.data && typeof json.data === "object" && ("data" in json.data || "unreadCount" in json.data)
        ? json.data
        : json;
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ data: [], unreadCount: 0 }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, recipientId, readAll } = body;

    if (readAll && recipientId) {
      const clean = decodeURIComponent(recipientId).trim().toLowerCase();
      const res = await fetch(
        `${BACKEND_API_URL}/notifications/recipient/${encodeURIComponent(clean)}/read-all`,
        {
          method: "PATCH",
          cache: "no-store",
        },
      ).catch(() => null);

      if (!res || !res.ok) {
        return NextResponse.json({ success: false }, { status: 500 });
      }
      const json = await res.json();
      return NextResponse.json(json);
    }

    if (id) {
      const res = await fetch(`${BACKEND_API_URL}/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        cache: "no-store",
      }).catch(() => null);

      if (!res || !res.ok) {
        return NextResponse.json({ success: false }, { status: 500 });
      }
      const json = await res.json();
      return NextResponse.json(json);
    }

    return NextResponse.json({ message: "Missing id or recipientId" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
