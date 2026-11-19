import { NextResponse } from "next/server";

import { requireAgencySession } from "@/app/api/agency/_session";
import type { UploadedDocument } from "@/features/visa/types";
import { backend } from "@/server/api/backend";
import { backendErrorResponse } from "@/server/http";

/** The API's own limit (`POST /upload`); checked here to save the round trip. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/agency/listing/upload — one compliance document, before it is
 * recorded against the listing (`PATCH /api/agency/listing/documents`).
 *
 * The API refuses anonymous uploads, and an agency holds no credential it
 * accepts: the agency session is this site's own cookie. So the browser sends
 * the file here, this route checks the session, and uploads it with this
 * server's key. The API still decides the type from the bytes, caps the size
 * and names the stored file itself.
 *
 * The file passes through this server, so the host's request-body limit
 * applies on top of the API's 10MB (Vercel functions accept about 4.5MB).
 */
export async function POST(request: Request) {
  const { response } = await requireAgencySession();
  if (response) return response;

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ message: "Choose a file to upload." }, { status: 400 });
  }
  // A form entry is a string or a file; only a non-empty file will do.
  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ message: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { message: "That file is over the 10MB limit." },
      { status: 413 },
    );
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name);

  try {
    const uploaded = await backend<UploadedDocument>("/upload", {
      method: "POST",
      body: upstream,
      service: true,
    });
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
