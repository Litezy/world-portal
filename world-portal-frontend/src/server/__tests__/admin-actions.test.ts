import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSessionToken } from "@/server/auth/session";
import type { AdminRole } from "@/types";

/**
 * The console's write routes (ADR 0016): refunds, fee settings and team
 * changes. Each is manager-only in the console *and* on the service, so a
 * staff session must be refused before anything reaches the API.
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

const refunds = await import("@/app/api/admin/finance/refunds/route");
const feeConfig = await import("@/app/api/admin/finance/config/route");
const team = await import("@/app/api/admin/team/route");
const member = await import("@/app/api/admin/team/[id]/route");
const resend = await import("@/app/api/admin/team/[id]/resend-invite/route");

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
const failed = (status: number, message: string) =>
  new Response(JSON.stringify({ success: false, statusCode: status, message }), {
    status,
  });

const send = (method: string, path: string, body?: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

/** The single call made to the API: its path, method, body and auth header. */
function lastCall() {
  const [input, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  const headers = new Headers(init.headers);
  return {
    path: new URL(String(input)).pathname.replace(/^\/api/, ""),
    method: init.method ?? "GET",
    body: init.body ? (JSON.parse(String(init.body)) as unknown) : undefined,
    auth: headers.get("Authorization"),
  };
}

const profile = {
  id: "pr_2",
  externalAuthId: "ext-1",
  firstName: "Ada",
  lastName: "Okafor",
  email: "ada@example.com",
  phone: null,
  role: "STAFF",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  cookie.value = undefined;
  fetchMock.mockReset();
});

describe("POST /api/admin/finance/refunds", () => {
  const body = { transactionRef: "TXN-1", reason: "Applicant withdrew before filing" };

  it("refuses without a session", async () => {
    const response = await refunds.POST(
      send("POST", "/api/admin/finance/refunds", body),
    );
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses staff before the API is asked", async () => {
    signInAs("STAFF");
    const response = await refunds.POST(
      send("POST", "/api/admin/finance/refunds", body),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("needs a reason the applicant can read", async () => {
    signInAs("MANAGER");
    const response = await refunds.POST(
      send("POST", "/api/admin/finance/refunds", { ...body, reason: "no" }),
    );
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards a manager's refund with their token", async () => {
    signInAs("MANAGER");
    fetchMock.mockResolvedValue(ok({ id: "rf_1", refundRef: "RFD-1" }));

    const response = await refunds.POST(
      send("POST", "/api/admin/finance/refunds", body),
    );

    expect(response.status).toBe(200);
    expect(lastCall()).toEqual({
      path: "/payments/refund",
      method: "POST",
      body,
      auth: "Bearer backend-token",
    });
  });

  it("passes the service's refusal through", async () => {
    signInAs("MANAGER");
    fetchMock.mockResolvedValue(
      failed(409, "Only confirmed transactions can be refunded"),
    );

    const response = await refunds.POST(
      send("POST", "/api/admin/finance/refunds", body),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      message: "Only confirmed transactions can be refunded",
    });
  });
});

describe("PATCH /api/admin/finance/config", () => {
  it("refuses staff", async () => {
    signInAs("STAFF");
    const response = await feeConfig.PATCH(
      send("PATCH", "/api/admin/finance/config", { serviceFeePercentage: 5 }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a percentage over 100", async () => {
    signInAs("MANAGER");
    const response = await feeConfig.PATCH(
      send("PATCH", "/api/admin/finance/config", {
        partnerMarkupPercentage: 10,
        serviceFeePercentage: 150,
        refundSurchargePercentage: 15,
      }),
    );
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends numbers, as the service's DTO requires", async () => {
    signInAs("MANAGER");
    fetchMock.mockResolvedValue(ok({ id: "cfg" }));

    const response = await feeConfig.PATCH(
      send("PATCH", "/api/admin/finance/config", {
        partnerMarkupPercentage: "10",
        serviceFeePercentage: "5.5",
        refundSurchargePercentage: 15,
      }),
    );

    expect(response.status).toBe(200);
    expect(lastCall()).toMatchObject({
      path: "/payments/config",
      method: "PATCH",
      body: {
        partnerMarkupPercentage: 10,
        serviceFeePercentage: 5.5,
        refundSurchargePercentage: 15,
      },
    });
  });
});

describe("team routes", () => {
  it("only lets a manager invite", async () => {
    signInAs("STAFF");
    const response = await team.POST(
      send("POST", "/api/admin/team", {
        firstName: "Ada",
        lastName: "Okafor",
        email: "ada@example.com",
        role: "STAFF",
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses staff changing someone's role", async () => {
    signInAs("STAFF");
    const response = await member.PATCH(
      send("PATCH", "/api/admin/team/pr_2", { role: "MANAGER" }),
      ctx("pr_2"),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an empty change", async () => {
    signInAs("MANAGER");
    const response = await member.PATCH(
      send("PATCH", "/api/admin/team/pr_2", {}),
      ctx("pr_2"),
    );
    expect(response.status).toBe(422);
  });

  it("forwards a role change and returns the updated member", async () => {
    signInAs("MANAGER");
    fetchMock.mockResolvedValue(ok({ ...profile, role: "MANAGER" }));

    const response = await member.PATCH(
      send("PATCH", "/api/admin/team/pr_2", { role: "MANAGER" }),
      ctx("pr_2"),
    );

    expect(response.status).toBe(200);
    expect(lastCall()).toMatchObject({
      path: "/profiles/pr_2",
      method: "PATCH",
      body: { role: "MANAGER" },
    });
    expect(await response.json()).toMatchObject({ data: { role: "MANAGER" } });
  });

  it("shows the service's last-manager refusal", async () => {
    signInAs("MANAGER");
    fetchMock.mockResolvedValue(
      failed(409, "The team needs at least one active manager"),
    );

    const response = await member.DELETE(
      send("DELETE", "/api/admin/team/pr_2"),
      ctx("pr_2"),
    );

    expect(response.status).toBe(409);
    expect(lastCall()).toMatchObject({ path: "/profiles/pr_2", method: "DELETE" });
    expect(await response.json()).toMatchObject({
      message: "The team needs at least one active manager",
    });
  });

  it("encodes the id so it cannot reach another path", async () => {
    signInAs("MANAGER");
    fetchMock.mockResolvedValue(ok({ sent: true }));

    await resend.POST(
      send("POST", "/api/admin/team/x/resend-invite"),
      ctx("../payments"),
    );

    expect(lastCall().path).toBe("/profiles/..%2Fpayments/resend-invite");
  });
});
