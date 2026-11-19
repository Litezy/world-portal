import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSessionToken } from "@/server/auth/session";
import type { AdminRole } from "@/types";

/**
 * Console route handlers, driven the way the browser drives them: a real
 * signed session cookie, the World Portal API stubbed at `fetch`.
 */

const cookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "wp_admin_session" && cookie.value ? { value: cookie.value } : undefined,
  }),
}));

const store = vi.hoisted(() => ({
  listAgencies: vi.fn(),
  updateAgencyVerification: vi.fn(),
  updateAgencyDocumentStatus: vi.fn(),
}));
vi.mock("@/server/agency/store", () => store);

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const agencies = await import("@/app/api/admin/agencies/route");
const professionals = await import("@/app/api/admin/professionals/route");
const stats = await import("@/app/api/admin/stats/route");
const finance = await import("@/app/api/admin/finance/route");
const applications = await import("@/app/api/admin/applications/route");
const search = await import("@/app/api/admin/search/route");

/** The development default — vitest does not load `.env.local`. */
const SESSION_SECRET = "world-portal-dev-session-secret";

function signInAs(role: AdminRole) {
  cookie.value = createSessionToken(
    {
      id: "pr_1",
      name: "Desk User",
      email: "desk@example.com",
      role,
      token: "backend-token",
    },
    SESSION_SECRET,
  ).token;
}

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 });
const failed = (status: number, message = "Upstream failed") =>
  new Response(JSON.stringify({ success: false, statusCode: status, message }), {
    status,
  });

/** Answer each API path with its own response. */
function routeFetch(routes: Record<string, () => Response>) {
  fetchMock.mockImplementation(async (input: URL | string) => {
    const path = new URL(String(input)).pathname.replace(/^\/api/, "");
    const handler = routes[path];
    if (!handler) throw new Error(`Unexpected call to ${path}`);
    return handler();
  });
}

const get = (path: string) => new Request(`http://localhost:3000${path}`);
const patch = (path: string, body: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  cookie.value = undefined;
  fetchMock.mockReset();
  Object.values(store).forEach((fn) => fn.mockReset());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/admin/agencies", () => {
  it("refuses without a session and never touches the store", async () => {
    const response = await agencies.GET(get("/api/admin/agencies"));

    expect(response.status).toBe(401);
    expect(store.listAgencies).not.toHaveBeenCalled();
  });

  it("refuses a partner — external accounts must not manage other businesses", async () => {
    signInAs("PARTNER");

    const listed = await agencies.GET(get("/api/admin/agencies"));
    const changed = await agencies.PATCH(
      patch("/api/admin/agencies?id=ag_1", { verification: "VERIFIED" }),
    );

    expect(listed.status).toBe(403);
    expect(changed.status).toBe(403);
    expect(store.updateAgencyVerification).not.toHaveBeenCalled();
  });

  it("lists agencies for desk staff", async () => {
    signInAs("STAFF");
    const page = {
      data: [{ id: "ag_1" }],
      meta: { page: 1, perPage: 6, total: 1, totalPages: 1 },
    };
    store.listAgencies.mockResolvedValue(page);

    const response = await agencies.GET(get("/api/admin/agencies?search=ridge&page=1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(page);
    expect(store.listAgencies).toHaveBeenCalledWith(
      expect.objectContaining({ q: "ridge", page: 1 }),
      { token: "backend-token" },
    );
  });

  it("reports an outage instead of an empty list", async () => {
    signInAs("MANAGER");
    store.listAgencies.mockRejectedValue(new Error("down"));

    const response = await agencies.GET(get("/api/admin/agencies"));

    expect(response.status).toBe(503);
  });

  it("answers 404 for an unknown agency rather than changing another one", async () => {
    signInAs("MANAGER");
    store.updateAgencyVerification.mockResolvedValue(null);

    const response = await agencies.PATCH(
      patch("/api/admin/agencies?id=missing", { verification: "VERIFIED" }),
    );

    expect(response.status).toBe(404);
  });

  it("rejects a body with neither a document decision nor a verification", async () => {
    signInAs("MANAGER");

    const response = await agencies.PATCH(patch("/api/admin/agencies?id=ag_1", {}));

    expect(response.status).toBe(422);
  });

  // The API checks the desk member's own role on these, so the console must
  // ask as that member: the service key is the agency portal's credential.
  it("reads the list with the desk member's token", async () => {
    signInAs("STAFF");
    store.listAgencies.mockResolvedValue({ data: [], meta: {} });

    await agencies.GET(get("/api/admin/agencies"));

    expect(store.listAgencies).toHaveBeenCalledWith(expect.any(Object), {
      token: "backend-token",
    });
  });

  it("verifies an agency with the desk member's token", async () => {
    signInAs("MANAGER");
    store.updateAgencyVerification.mockResolvedValue({ id: "ag_1" });

    const response = await agencies.PATCH(
      patch("/api/admin/agencies?id=ag_1", { verification: "VERIFIED" }),
    );

    expect(response.status).toBe(200);
    expect(store.updateAgencyVerification).toHaveBeenCalledWith("ag_1", "VERIFIED", {
      token: "backend-token",
    });
  });

  it("rules on a document with the desk member's token", async () => {
    signInAs("STAFF");
    store.updateAgencyDocumentStatus.mockResolvedValue({ id: "ag_1" });

    const response = await agencies.PATCH(
      patch("/api/admin/agencies?id=ag_1", {
        docId: "tax_certificate",
        docStatus: "approved",
      }),
    );

    expect(response.status).toBe(200);
    expect(store.updateAgencyDocumentStatus).toHaveBeenCalledWith(
      "ag_1",
      "tax_certificate",
      "approved",
      undefined,
      { token: "backend-token" },
    );
  });
});

describe("/api/admin/professionals", () => {
  it("refuses without a session and never calls the API", async () => {
    const response = await professionals.GET(get("/api/admin/professionals"));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the API with the session's token and filters what the service ignores", async () => {
    signInAs("STAFF");
    const pro = (id: string, name: string, category: string, isVerified: boolean) => ({
      id,
      name,
      title: "Photographer",
      category,
      bio: null,
      // The service's ProfessionalProfile has no city.
      country: "Portugal",
      isVerified,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const page = {
      data: [
        pro("pro_1", "Kenji Watanabe", "photographer", true),
        pro("pro_2", "Ada Okafor", "photographer", false),
        pro("pro_3", "Kenji Sato", "chef", false),
      ],
      meta: { total: 3, page: 1, limit: 500, pages: 1 },
    };
    routeFetch({ "/hire/professionals/admin": () => ok(page) });

    const response = await professionals.GET(
      get("/api/admin/professionals?q=kenji&category=photographer"),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { id: string }[];
      meta: { total: number; counts: Record<string, number> };
    };
    expect(body.data.map((p) => p.id)).toEqual(["pro_1"]);
    expect(body.meta.counts).toEqual({ verified: 1 });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.searchParams.get("limit")).toBe("500");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer backend-token",
    );
  });

  it("searches past the name and title without a city to trip over", async () => {
    signInAs("STAFF");
    routeFetch({
      "/hire/professionals/admin": () =>
        ok({
          data: [
            {
              id: "pro_1",
              name: "Ada Okafor",
              title: "Photographer",
              category: "photographer",
              bio: null,
              country: "Portugal",
              isVerified: true,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          meta: {},
        }),
    });

    const response = await professionals.GET(
      get("/api/admin/professionals?q=portugal"),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { id: string }[] };
    expect(body.data.map((p) => p.id)).toEqual(["pro_1"]);
  });

  it("filters by verification", async () => {
    signInAs("STAFF");
    routeFetch({
      "/hire/professionals/admin": () =>
        ok({
          data: [
            {
              id: "a",
              name: "A",
              title: "",
              category: "chef",
              country: "",
              isVerified: true,
              createdAt: "2026-01-02T00:00:00.000Z",
            },
            {
              id: "b",
              name: "B",
              title: "",
              category: "chef",
              country: "",
              isVerified: false,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          meta: {},
        }),
    });

    const response = await professionals.GET(
      get("/api/admin/professionals?status=unverified"),
    );
    const body = (await response.json()) as { data: { id: string }[] };

    expect(body.data.map((p) => p.id)).toEqual(["b"]);
  });

  it("surfaces an API failure instead of an empty list", async () => {
    signInAs("MANAGER");
    routeFetch({ "/hire/professionals/admin": () => failed(500) });

    const response = await professionals.GET(get("/api/admin/professionals"));

    expect(response.status).toBe(500);
  });

  it("only accepts a boolean verification", async () => {
    signInAs("MANAGER");

    const response = await professionals.PATCH(
      patch("/api/admin/professionals?id=pro_1", { isVerified: "yes" }),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies with the session's token and never the service key", async () => {
    vi.stubEnv("SERVICE_AUTH_KEY", "k".repeat(40));
    signInAs("MANAGER");
    routeFetch({
      "/hire/professionals/pro_1/verify": () => ok({ id: "pro_1", isVerified: true }),
    });

    const response = await professionals.PATCH(
      patch("/api/admin/professionals?id=pro_1", { isVerified: true }),
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer backend-token");
    expect(headers["x-service-key"]).toBeUndefined();
  });
});

describe("/api/admin/stats", () => {
  it("fails loudly when a collection can't be read, instead of showing zeros", async () => {
    signInAs("MANAGER");
    routeFetch({
      "/visa-documentation": () => ok([]),
      "/passport-application": () => ok([]),
      "/payments/transactions": () => failed(503, "Service unavailable"),
    });

    const response = await stats.GET();

    expect(response.status).toBe(503);
  });
});

describe("/api/admin/finance", () => {
  const config = {
    id: "cfg",
    partnerMarkupPercentage: "10.00",
    serviceFeePercentage: "7.50",
    refundSurchargePercentage: "12.00",
    updatedBy: "manager@example.com",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const transactions = [
    {
      id: "tx_1",
      transactionRef: "BANK-001",
      amount: "100.00",
      status: "CONFIRMED",
      paymentOption: "FULL",
      paymentMethod: "BANK_TRANSFER",
      visaDocumentation: { currency: "USD" },
      refunds: [],
    },
    {
      id: "tx_2",
      transactionRef: "BANK-002",
      amount: "50000.00",
      status: "REFUNDED",
      paymentOption: "HALF_INSTALLMENT",
      paymentMethod: "BANK_TRANSFER",
      visaDocumentation: { currency: "NGN" },
      refunds: [
        {
          id: "rf_1",
          refundRef: "RFD-1",
          netRefundAmount: "44000.00",
          reason: "Withdrawn",
        },
      ],
    },
  ];

  it("reports the service's own figures, per currency", async () => {
    signInAs("MANAGER");
    routeFetch({
      "/payments/transactions": () => ok(transactions),
      "/visa-documentation": () => ok([]),
      "/passport-application": () => ok([]),
      "/payments/config": () => ok(config),
    });

    const response = await finance.GET(get("/api/admin/finance?tab=refunds"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({
      revenueByCurrency: { USD: 100 },
      outstandingByCurrency: {},
      refundVolumeByCurrency: { NGN: 44000 },
      refundCount: 1,
      serviceFeePercentage: 7.5,
      refundSurchargePercentage: 12,
    });
    // Refunds come nested on their transaction — there is no refunds endpoint.
    expect(body.data).toEqual([
      expect.objectContaining({
        refundRef: "RFD-1",
        currency: "NGN",
        transactionRef: "BANK-002",
      }),
    ]);
  });

  it("never invents a fee configuration when the service doesn't return one", async () => {
    signInAs("MANAGER");
    routeFetch({
      "/payments/transactions": () => ok(transactions),
      "/visa-documentation": () => ok([]),
      "/passport-application": () => ok([]),
      "/payments/config": () => failed(503),
    });

    const response = await finance.GET(get("/api/admin/finance?tab=config"));

    expect(response.status).toBe(503);
  });
});

/** Just enough of a service visa record for the console's mapper. */
const visaRecord = (
  id: string,
  firstName: string,
  status: string,
  createdAt: string,
) => ({
  id,
  applicationNo: `VISA-2026-${id}`,
  firstName,
  lastName: "Okafor",
  email: `${firstName.toLowerCase()}@example.com`,
  phone: "+234 800 000 0000",
  targetCountry: "Canada",
  visaCategory: "TOURIST",
  status,
  paymentStatus: "PENDING_EVALUATION",
  totalAmount: "0",
  currency: "USD",
  amountPaid: "0",
  balanceDue: "0",
  allowInstallment: false,
  createdAt,
  updatedAt: createdAt,
});

describe("/api/admin/applications", () => {
  it("returns per-stage counts for the tabs alongside the filtered page", async () => {
    signInAs("STAFF");
    routeFetch({
      "/visa-documentation": () =>
        ok([
          visaRecord("1", "Ada", "SUBMITTED", "2026-11-01T10:00:00.000Z"),
          visaRecord("2", "Bisi", "APPROVED", "2026-11-02T10:00:00.000Z"),
          visaRecord("3", "Chidi", "SUBMITTED", "2026-11-03T10:00:00.000Z"),
        ]),
    });

    const response = await applications.GET(
      get("/api/admin/applications?status=SUBMITTED&sort=applicant&dir=desc"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.counts).toEqual({ SUBMITTED: 2, APPROVED: 1 });
    expect(body.data.map((v: { id: string }) => v.id)).toEqual(["3", "1"]);
    // Status is filtered here, after counting — not by the service.
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.has("status")).toBe(false);
  });
});

describe("/api/admin/search", () => {
  it("needs two characters before it asks the service anything", async () => {
    signInAs("MANAGER");

    const response = await search.GET(get("/api/admin/search?q=a"));

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("groups records and applicants without exposing emails", async () => {
    signInAs("PARTNER");
    routeFetch({
      "/visa-documentation": () =>
        ok([visaRecord("1", "Ada", "SUBMITTED", "2026-11-01T10:00:00.000Z")]),
      "/passport-application": () => ok([]),
    });

    const response = await search.GET(get("/api/admin/search?q=ada"));
    const body = await response.json();

    expect(body.data.visas).toEqual([
      { id: "1", reference: "VISA-2026-1", name: "Ada Okafor", status: "SUBMITTED" },
    ]);
    expect(body.data.applicants).toEqual([{ name: "Ada Okafor", applications: 1 }]);
    expect(JSON.stringify(body)).not.toContain("@example.com");
  });
});

describe("list filters", () => {
  it("answers an oversized search with 422, not a server error", async () => {
    signInAs("MANAGER");

    const response = await applications.GET(
      get(`/api/admin/applications?q=${"x".repeat(200)}`),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
