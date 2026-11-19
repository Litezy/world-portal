import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAgencySessionToken } from "@/server/agency/session";
import { createSessionToken } from "@/server/auth/session";

/**
 * The bell in the applicant and agency topbars. Whose inbox it reads is
 * decided here, from the caller's own session — never from a recipient id in
 * the query string or the body, which anyone can change to someone else's
 * email or agency id.
 */

const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined,
  }),
}));

const auth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { GET, PATCH } = await import("@/app/api/notifications/route");

/** The development default — vitest does not load `.env.local`. */
const SESSION_SECRET = "world-portal-dev-session-secret";
const SERVICE_KEY = "service-key-for-tests-0123456789abcdef";

function signInAgency(agencyId = "agency-1") {
  cookieJar.set(
    "wp_agency_session",
    createAgencySessionToken(
      {
        id: "agu-1",
        name: "Owner",
        email: "owner@agency.example",
        role: "owner",
        agencyId,
        agencyName: "Test Agency",
      },
      SESSION_SECRET,
    ).token,
  );
}

function signInAdmin() {
  cookieJar.set(
    "wp_admin_session",
    createSessionToken(
      {
        id: "pr_1",
        name: "Desk User",
        email: "desk@example.com",
        role: "STAFF",
        token: "desk-token",
      },
      SESSION_SECRET,
    ).token,
  );
}

function signInApplicant() {
  auth.mockResolvedValue({
    userId: "user_123",
    getToken: vi.fn().mockResolvedValue("session-jwt"),
  });
}

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 });

const get = (query: string) =>
  new Request(`http://localhost:3000/api/notifications?${query}`);
const patch = (body: unknown) =>
  new Request("http://localhost:3000/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1) as [URL, RequestInit];
  return {
    url: new URL(String(url)),
    init,
    headers: (init.headers ?? {}) as Record<string, string>,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  };
}

describe("/api/notifications", () => {
  beforeEach(() => {
    cookieJar.clear();
    auth.mockReset();
    auth.mockResolvedValue({ userId: null, getToken: vi.fn() });
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => ok({ data: [], unreadCount: 0 }));
    vi.stubEnv("SERVICE_AUTH_KEY", SERVICE_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("signed out", () => {
    it.each(["agency", "applicant", "admin"])(
      "refuses the %s inbox and never calls the API",
      async (audience) => {
        const response = await GET(
          get(`audience=${audience}&recipientId=victim@example.com`),
        );
        expect(response.status).toBe(401);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it("no longer reads an inbox named only by recipientId", async () => {
      const response = await GET(get("recipientId=victim@example.com"));
      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("refuses to mark anything read", async () => {
      const one = await PATCH(patch({ audience: "agency", id: "n-1" }));
      const all = await PATCH(
        patch({
          audience: "applicant",
          readAll: true,
          recipientId: "victim@example.com",
        }),
      );
      expect(one.status).toBe(401);
      expect(all.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("an agency", () => {
    it("reads its own inbox by session agencyId, whatever the query says", async () => {
      signInAgency("agency-1");
      fetchMock.mockResolvedValue(ok({ data: [{ id: "n-1" }], unreadCount: 1 }));

      const response = await GET(get("audience=agency&recipientId=agency-2&limit=30"));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        data: [{ id: "n-1" }],
        unreadCount: 1,
      });
      const call = lastCall();
      expect(call.url.pathname).toMatch(/\/notifications\/agency-1$/);
      expect(call.url.searchParams.get("limit")).toBe("30");
      expect(call.headers["x-service-key"]).toBe(SERVICE_KEY);
      expect(call.headers.Authorization).toBeUndefined();
    });

    it("marks one read as its own recipient, ignoring a recipient in the body", async () => {
      signInAgency("agency-1");
      fetchMock.mockResolvedValue(ok({ id: "n-1", isRead: true }));

      const response = await PATCH(
        patch({ audience: "agency", id: "n-1", recipientId: "agency-2" }),
      );

      expect(response.status).toBe(200);
      const call = lastCall();
      expect(call.init.method).toBe("PATCH");
      expect(call.url.pathname).toMatch(/\/notifications\/n-1\/read$/);
      expect(call.body).toEqual({ recipientId: "agency-1" });
      expect(call.headers["x-service-key"]).toBe(SERVICE_KEY);
    });

    it("marks all read for its own recipient only", async () => {
      signInAgency("agency-1");
      fetchMock.mockResolvedValue(ok({ count: 2 }));

      const response = await PATCH(
        patch({ audience: "agency", readAll: true, recipientId: "agency-2" }),
      );

      expect(response.status).toBe(200);
      expect(lastCall().url.pathname).toMatch(
        /\/notifications\/recipient\/agency-1\/read-all$/,
      );
    });

    it("passes the API's 404 through for a notification that isn't its own", async () => {
      signInAgency("agency-1");
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ message: 'Notification "n-9" not found' }), {
          status: 404,
        }),
      );

      const response = await PATCH(patch({ audience: "agency", id: "n-9" }));
      expect(response.status).toBe(404);
    });

    it("cannot read the applicant inbox with an agency cookie", async () => {
      signInAgency("agency-1");
      const response = await GET(get("audience=applicant"));
      expect(response.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("an applicant", () => {
    it("reads their own inbox as themselves — by session token, never by email", async () => {
      signInApplicant();
      fetchMock.mockResolvedValue(ok({ data: [{ id: "n-2" }], unreadCount: 1 }));

      const response = await GET(
        get("audience=applicant&recipientId=victim@example.com"),
      );

      expect(response.status).toBe(200);
      const call = lastCall();
      expect(call.url.pathname).toMatch(/\/me\/notifications$/);
      expect(call.url.search).not.toContain("victim");
      expect(call.headers.Authorization).toBe("Bearer session-jwt");
      expect(call.headers["x-service-key"]).toBeUndefined();
    });

    it("marks one and all read through their own inbox", async () => {
      signInApplicant();
      fetchMock.mockImplementation(async () => ok({ count: 1 }));

      await PATCH(patch({ audience: "applicant", id: "n-2" }));
      expect(lastCall().url.pathname).toMatch(/\/me\/notifications\/n-2\/read$/);
      expect(lastCall().headers.Authorization).toBe("Bearer session-jwt");

      await PATCH(
        patch({
          audience: "applicant",
          readAll: true,
          recipientId: "victim@example.com",
        }),
      );
      expect(lastCall().url.pathname).toMatch(/\/me\/notifications\/read-all$/);
      expect(lastCall().body).toBeUndefined();
    });

    it("cannot read an agency inbox with a WorldStreet session", async () => {
      signInApplicant();
      const response = await GET(get("audience=agency&recipientId=agency-1"));
      expect(response.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("a console member", () => {
    it("reads the inbox filed under their own email", async () => {
      signInAdmin();

      const response = await GET(get("audience=admin&recipientId=victim@example.com"));

      expect(response.status).toBe(200);
      const call = lastCall();
      expect(call.url.pathname).toMatch(/\/notifications\/desk%40example\.com$/);
      expect(call.headers["x-service-key"]).toBe(SERVICE_KEY);
    });
  });

  it("refuses an id that could change the API path", async () => {
    signInAgency("agency-1");
    const response = await PATCH(
      patch({ audience: "agency", id: "../recipient/agency-2" }),
    );
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
