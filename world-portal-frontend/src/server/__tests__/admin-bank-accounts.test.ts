import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSessionToken } from "@/server/auth/session";
import type { AdminRole } from "@/types";

/**
 * The bank accounts applicants wire money to. Anyone at the desk may read
 * them; only a manager may add, change or delete one, because a changed
 * account number redirects applicants' payments.
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

const collection = await import("@/app/api/admin/bank-accounts/route");
const single = await import("@/app/api/admin/bank-accounts/[id]/route");

/** The development default — vitest does not load `.env.local`. */
const SESSION_SECRET = "world-portal-dev-session-secret";

function signInAs(role: AdminRole) {
  cookie.value = createSessionToken(
    {
      id: "pr_1",
      name: "Desk User",
      email: "desk@example.com",
      role,
      token: "desk-token",
    },
    SESSION_SECRET,
  ).token;
}

const ACCOUNT = {
  bankName: "Sample Bank",
  accountName: "E-Embassy",
  accountNumber: "0001112223",
  currency: "USD",
};

const json = (method: string, path: string, body?: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const mutations = {
  create: () => collection.POST(json("POST", "/api/admin/bank-accounts", ACCOUNT)),
  update: () =>
    single.PATCH(
      json("PATCH", "/api/admin/bank-accounts/b1", { accountNumber: "999" }),
      ctx("b1"),
    ),
  remove: () => single.DELETE(json("DELETE", "/api/admin/bank-accounts/b1"), ctx("b1")),
};

beforeEach(() => {
  cookie.value = undefined;
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ success: true, data: { id: "b1" } }), {
      status: 200,
    }),
  );
});

describe("bank account changes are manager-only", () => {
  it.each(Object.keys(mutations) as (keyof typeof mutations)[])(
    "%s needs a session",
    async (name) => {
      expect((await mutations[name]()).status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(
    (["STAFF", "PARTNER"] as const).flatMap((role) =>
      (Object.keys(mutations) as (keyof typeof mutations)[]).map(
        (name) => [role, name] as const,
      ),
    ),
  )("%s may not %s an account", async (role, name) => {
    signInAs(role);
    expect((await mutations[name]()).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(Object.keys(mutations) as (keyof typeof mutations)[])(
    "a manager may %s an account, with their own token",
    async (name) => {
      signInAs("MANAGER");
      expect((await mutations[name]()).status).toBe(200);
      const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer desk-token",
      );
    },
  );

  it("staff can still read the accounts", async () => {
    signInAs("STAFF");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }),
    );
    expect((await collection.GET()).status).toBe(200);
  });
});

describe("bank account ids stay inside their path segment", () => {
  it.each(["PATCH", "DELETE"] as const)("%s encodes the id", async (method) => {
    signInAs("MANAGER");
    const id = "b1/../../profiles?role=MANAGER";
    const request = json(
      method,
      "/api/admin/bank-accounts/x",
      method === "PATCH" ? { isActive: false } : undefined,
    );

    await (method === "PATCH"
      ? single.PATCH(request, ctx(id))
      : single.DELETE(request, ctx(id)));

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe(`/api/bank-accounts/${encodeURIComponent(id)}`);
    expect(url.search).toBe("");
  });
});
