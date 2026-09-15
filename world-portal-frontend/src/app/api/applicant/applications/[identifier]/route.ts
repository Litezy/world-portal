import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;

    if (!identifier) {
      return NextResponse.json([]);
    }

    const clean = decodeURIComponent(identifier).trim();
    const encodedIdentifier = encodeURIComponent(clean);

    const [visaRes, passportRes] = await Promise.all([
      fetch(`${BACKEND_API_URL}/visa-documentation/applicant/${encodedIdentifier}`, {
        cache: "no-store",
      }).catch(() => null),
      fetch(`${BACKEND_API_URL}/passport-application/applicant/${encodedIdentifier}`, {
        cache: "no-store",
      }).catch(() => null),
    ]);

    const visaJson = visaRes && visaRes.ok ? await visaRes.json() : [];
    const passportJson = passportRes && passportRes.ok ? await passportRes.json() : [];

    const visaDocs = Array.isArray(visaJson)
      ? visaJson
      : Array.isArray(visaJson?.data)
        ? visaJson.data
        : [];

    const passportDocs = Array.isArray(passportJson)
      ? passportJson
      : Array.isArray(passportJson?.data)
        ? passportJson.data
        : [];

    const formattedVisa = visaDocs.map((doc: any) => ({ ...doc, type: "VISA" as const }));
    const formattedPassport = passportDocs.map((doc: any) => ({ ...doc, type: "PASSPORT" as const }));

    const combined = [...formattedVisa, ...formattedPassport].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(combined);
  } catch (error) {
    return NextResponse.json([]);
  }
}
