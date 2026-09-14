import { NextResponse } from "next/server";
import { listAgencies, updateAgencyDocumentStatus, updateAgencyVerification } from "@/server/agency/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const verification = searchParams.get("verification") || undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
  const perPage = searchParams.get("perPage") ? parseInt(searchParams.get("perPage")!, 10) : 6;

  try {
    const paginated = await listAgencies({
      q,
      status,
      verification: verification as any,
      page,
      perPage,
    });
    return NextResponse.json(paginated);
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0, page: 1, perPage, totalPages: 1 } });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ message: "Agency ID is required" }, { status: 400 });
    }

    if (body.docId && body.docStatus) {
      const updated = await updateAgencyDocumentStatus(id, body.docId, body.docStatus, body.note);
      if (updated) {
        return NextResponse.json({ data: updated, message: "Document status updated" });
      }
      return NextResponse.json({ message: "Failed to update document status" }, { status: 400 });
    }

    const verification = body.verification || body.status;
    if (!verification) {
      return NextResponse.json({ message: "Verification status is required" }, { status: 400 });
    }

    const updated = await updateAgencyVerification(id, verification);
    if (updated) {
      return NextResponse.json({ data: updated, message: "Verification updated" });
    }
    return NextResponse.json({ message: "Failed to update agency verification status" }, { status: 400 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
