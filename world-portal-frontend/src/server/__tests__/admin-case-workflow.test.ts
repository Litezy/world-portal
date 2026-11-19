import { beforeEach, describe, expect, it, vi } from "vitest";

import { canEvaluate, canMove, nextStatuses } from "@/features/applications/workflow";
import { createSessionToken } from "@/server/auth/session";
import { customerKey, isCustomerKey } from "@/server/data/customer-key";
import type { AdminRole } from "@/types";
import { confirmBankPaymentSchema, inviteApplicantSchema } from "@/validations/admin";

/**
 * The desk's rules for a file (ADR 0017 §4.3 mirrored in the console), the
 * opaque applicant keys, and the routes that enforce both.
 */

const cookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "wp_admin_session" && cookie.value ? { value: cookie.value } : undefined,
  }),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const visaRoute = await import("@/app/api/admin/applications/[id]/route");
const passportRoute = await import("@/app/api/admin/passports/[id]/route");
const customersRoute = await import("@/app/api/admin/customers/route");
const customerRoute = await import("@/app/api/admin/customers/[key]/route");
const bankRoute =
  await import("@/app/api/admin/applications/[id]/confirm-bank-payment/route");

function signInAs(role: AdminRole) {
  cookie.value = createSessionToken(
    {
      id: "pr_1",
      name: "Desk User",
      email: "desk@example.com",
      role,
      token: "backend-token",
    },
    "world-portal-dev-session-secret",
  ).token;
}

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 });

/** Answer `METHOD /path` with a handler; anything else fails the test. */
function routeFetch(routes: Record<string, () => Response>) {
  fetchMock.mockImplementation(async (input: URL | string, init?: RequestInit) => {
    const path = new URL(String(input)).pathname.replace(/^\/api/, "");
    const key = `${init?.method ?? "GET"} ${path}`;
    const handler = routes[key];
    if (!handler) throw new Error(`Unexpected call to ${key}`);
    return handler();
  });
}

const patch = (path: string, body: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const get = (path: string) => new Request(`http://localhost:3000${path}`);
const ctx = <T extends Record<string, string>>(params: T) => ({
  params: Promise.resolve(params),
});

function visaRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "v1",
    applicationNo: "WP-V-1",
    profileId: null,
    firstName: "Ada",
    lastName: "Okafor",
    email: "ada@example.com",
    phone: "+234",
    dateOfBirth: "1990-01-01",
    gender: "FEMALE",
    nationality: "Nigeria",
    residenceAddress: "Lagos",
    passportNumber: "A1",
    passportExpiryDate: "2030-01-01",
    targetCountry: "Ghana",
    visaCategory: "TOURIST",
    intendedArrivalDate: "2026-12-01",
    intendedDepartureDate: "2026-12-10",
    purposeOfVisit: "Holiday",
    totalAmount: "100.00",
    currency: "USD",
    amountPaid: "0.00",
    balanceDue: "100.00",
    allowInstallment: false,
    paymentStatus: "AWAITING_PAYMENT",
    status: "UNDER_REVIEW",
    verificationNotes: null,
    rejectionReason: null,
    evaluatedBy: "Desk User",
    evaluatedAt: "2026-11-01T00:00:00.000Z",
    reviewedBy: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  cookie.value = undefined;
  fetchMock.mockReset();
});

describe("case transitions", () => {
  it("matches ADR 0017: review, then a final decision", () => {
    expect(nextStatuses("SUBMITTED")).toEqual(["UNDER_REVIEW", "REJECTED"]);
    expect(nextStatuses("EVALUATED")).toEqual(["UNDER_REVIEW", "REJECTED"]);
    expect(nextStatuses("UNDER_REVIEW")).toEqual(["APPROVED", "REJECTED"]);
    expect(nextStatuses("APPROVED")).toEqual([]);
    expect(nextStatuses("REJECTED")).toEqual([]);
  });

  it("never approves straight from submission, and never repeats a stage", () => {
    expect(canMove("SUBMITTED", "APPROVED")).toBe(false);
    expect(canMove("APPROVED", "APPROVED")).toBe(false);
    expect(canMove("APPROVED", "SUBMITTED")).toBe(false);
  });

  it("only lets the cost change while no money is held and nothing is decided", () => {
    expect(canEvaluate("SUBMITTED", "PENDING_EVALUATION")).toBe(true);
    expect(canEvaluate("EVALUATED", "AWAITING_PAYMENT")).toBe(true);
    expect(canEvaluate("EVALUATED", "REFUNDED")).toBe(true);
    expect(canEvaluate("EVALUATED", "PARTIALLY_PAID")).toBe(false);
    expect(canEvaluate("EVALUATED", "FULLY_PAID")).toBe(false);
    expect(canEvaluate("UNDER_REVIEW", "FULLY_PAID")).toBe(false);
    expect(canEvaluate("APPROVED", "PENDING_EVALUATION")).toBe(false);
    expect(canEvaluate("REJECTED", "REFUNDED")).toBe(false);
  });

  it("can still price a file whose review started first, or whose payment was refunded", () => {
    // Start review is offered on an unpriced file; without this it could never be paid for.
    expect(canMove("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canEvaluate("UNDER_REVIEW", "PENDING_EVALUATION")).toBe(true);
    expect(canEvaluate("UNDER_REVIEW", "REFUNDED")).toBe(true);
  });
});

describe("PATCH /api/admin/applications/[id]", () => {
  it("refuses a partner before anything is read", async () => {
    signInAs("PARTNER");
    const response = await visaRoute.PATCH(
      patch("/api/admin/applications/v1", { status: "APPROVED" }),
      ctx({ id: "v1" }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a move the workflow doesn't allow, without touching the status", async () => {
    signInAs("STAFF");
    routeFetch({
      "GET /visa-documentation/v1": () => ok(visaRecord({ status: "SUBMITTED" })),
    });

    const response = await visaRoute.PATCH(
      patch("/api/admin/applications/v1", { status: "APPROVED" }),
      ctx({ id: "v1" }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      allowed: ["UNDER_REVIEW", "REJECTED"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("won't re-approve an approved file (it would email the applicant again)", async () => {
    signInAs("MANAGER");
    routeFetch({
      "GET /visa-documentation/v1": () => ok(visaRecord({ status: "APPROVED" })),
    });

    const response = await visaRoute.PATCH(
      patch("/api/admin/applications/v1", { status: "APPROVED" }),
      ctx({ id: "v1" }),
    );

    expect(response.status).toBe(409);
  });

  it("passes an allowed move through", async () => {
    signInAs("STAFF");
    routeFetch({
      "GET /visa-documentation/v1": () => ok(visaRecord({ status: "UNDER_REVIEW" })),
      "PATCH /visa-documentation/v1/status": () =>
        ok(visaRecord({ status: "APPROVED" })),
    });

    const response = await visaRoute.PATCH(
      patch("/api/admin/applications/v1", { status: "APPROVED" }),
      ctx({ id: "v1" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { status: "APPROVED" } });
  });
});

describe("PATCH /api/admin/passports/[id]", () => {
  it("applies the same table to passports", async () => {
    signInAs("STAFF");
    routeFetch({
      "GET /passport-application/p1": () =>
        ok({ ...visaRecord(), id: "p1", status: "REJECTED" }),
    });

    const response = await passportRoute.PATCH(
      patch("/api/admin/passports/p1", { status: "UNDER_REVIEW" }),
      ctx({ id: "p1" }),
    );

    expect(response.status).toBe(409);
  });
});

describe("applicant keys", () => {
  it("are stable, case-insensitive and never the email", () => {
    const key = customerKey("Ada@Example.com ");
    expect(key).toBe(customerKey("ada@example.com"));
    expect(key).not.toContain("ada");
    expect(isCustomerKey(key)).toBe(true);
    expect(isCustomerKey("ada@example.com")).toBe(false);
  });

  it("keep emails out of the customer list's row ids", async () => {
    signInAs("STAFF");
    routeFetch({
      "GET /visa-documentation": () => ok([visaRecord()]),
      "GET /passport-application": () => ok([]),
    });

    const response = await customersRoute.GET(get("/api/admin/customers"));
    const body = (await response.json()) as { data: { id: string; email: string }[] };

    expect(body.data[0].email).toBe("ada@example.com");
    expect(body.data[0].id).toBe(customerKey("ada@example.com"));
  });

  it("open one applicant with everything they applied for", async () => {
    signInAs("STAFF");
    routeFetch({
      "GET /visa-documentation": () =>
        ok([visaRecord(), visaRecord({ id: "v2", email: "someone@else.com" })]),
      "GET /passport-application": () => ok([]),
    });

    const key = customerKey("ada@example.com");
    const response = await customerRoute.GET(
      get(`/api/admin/customers/${key}`),
      ctx({ key }),
    );
    const body = (await response.json()) as {
      data: { customer: { name: string }; visas: { id: string }[] };
    };

    expect(response.status).toBe(200);
    expect(body.data.customer.name).toBe("Ada Okafor");
    expect(body.data.visas.map((v) => v.id)).toEqual(["v1"]);
  });

  it("answer 404 for a malformed or unknown key without reading anything", async () => {
    signInAs("STAFF");
    const response = await customerRoute.GET(
      get("/api/admin/customers/ada@example.com"),
      ctx({ key: "ada@example.com" }),
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("bank transfer and invite rules", () => {
  it("reject a zero payment and an oversized reference at the route", async () => {
    signInAs("STAFF");
    const response = await bankRoute.POST(
      new Request(
        "http://localhost:3000/api/admin/applications/v1/confirm-bank-payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 0, paymentOption: "FULL" }),
        },
      ),
      ctx({ id: "v1" }),
    );
    expect(response.status).toBe(422);
    expect(
      confirmBankPaymentSchema.safeParse({
        amount: 10,
        paymentOption: "FULL",
        bankReference: "x".repeat(81),
      }).success,
    ).toBe(false);
  });

  it("refuse an appointment in the past", () => {
    const invite = {
      purpose: "Visa interview",
      time: "10:00 AM",
      location: "Room 302",
    };
    expect(
      inviteApplicantSchema.safeParse({ ...invite, date: "2020-01-01" }).success,
    ).toBe(false);
    const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    expect(inviteApplicantSchema.safeParse({ ...invite, date: nextWeek }).success).toBe(
      true,
    );
  });
});
