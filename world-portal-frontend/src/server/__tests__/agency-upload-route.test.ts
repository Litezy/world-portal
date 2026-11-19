import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAgencySessionToken } from "@/server/agency/session";

/**
 * The agency portal's compliance documents. An agency has no credential the
 * API accepts (its session is this site's own cookie), so the file comes here
 * first: the route checks the agency session, then uploads with this server's
 * key. The API's `POST /upload` refuses anonymous uploads.
 */

const cookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "wp_agency_session" && cookie.value
        ? { value: cookie.value }
        : undefined,
  }),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { POST } = await import("@/app/api/agency/listing/upload/route");

const SESSION_SECRET = "world-portal-dev-session-secret";
const SERVICE_KEY = "service-key-for-tests-0123456789abcdef";

function signInAgency() {
  cookie.value = createAgencySessionToken(
    {
      id: "agu-1",
      name: "Owner",
      email: "owner@agency.example",
      role: "owner",
      agencyId: "agency-1",
      agencyName: "Test Agency",
    },
    SESSION_SECRET,
  ).token;
}

function uploadRequest(file?: File) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("http://localhost:3000/api/agency/listing/upload", {
    method: "POST",
    body: form,
  });
}

const pdf = () =>
  new File([new TextEncoder().encode("%PDF-1.7\n%%EOF\n")], "licence.pdf", {
    type: "application/pdf",
  });

describe("POST /api/agency/listing/upload", () => {
  beforeEach(() => {
    cookie.value = undefined;
    fetchMock.mockReset();
    vi.stubEnv("SERVICE_AUTH_KEY", SERVICE_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses without an agency session and never calls the API", async () => {
    const response = await POST(uploadRequest(pdf()));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploads with this server's key for a signed-in agency", async () => {
    signInAgency();
    const uploaded = {
      url: "https://storage.example/documents/abc.pdf",
      key: "documents/abc.pdf",
      originalName: "licence.pdf",
      mimeType: "application/pdf",
      size: 15,
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: uploaded }), { status: 201 }),
    );

    const response = await POST(uploadRequest(pdf()));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(uploaded);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(new URL(String(url)).pathname).toMatch(/\/upload$/);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-service-key"]).toBe(SERVICE_KEY);
    // The browser-style multipart boundary must be left to fetch.
    expect(headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
    const sent = (init.body as FormData).get("file");
    expect(sent).toBeInstanceOf(File);
    expect((sent as File).name).toBe("licence.pdf");
  });

  it("refuses a file over 10MB before calling the API", async () => {
    signInAgency();
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.pdf", {
      type: "application/pdf",
    });
    const response = await POST(uploadRequest(big));
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a request with no file", async () => {
    signInAgency();
    const response = await POST(uploadRequest());
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the API's refusal through, e.g. a file that is not a document", async () => {
    signInAgency();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Use a PDF, JPG, PNG or WEBP file." }), {
        status: 400,
      }),
    );
    const response = await POST(uploadRequest(pdf()));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Use a PDF, JPG, PNG or WEBP file.",
    });
  });
});
