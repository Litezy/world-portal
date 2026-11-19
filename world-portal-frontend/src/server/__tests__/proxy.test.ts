import type { NextFetchEvent } from "next/server";
import { NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

// Stand-in for Clerk: records which requests reach the applicant guard.
const clerkGuard = vi.hoisted(() => vi.fn(() => new Response(null, { status: 204 })));
vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: () => clerkGuard,
}));

const { proxy } = await import("@/proxy");
const { createSessionToken } = await import("@/server/auth/session");
const { createAgencySessionToken } = await import("@/server/agency/session");

/** The development default — vitest does not load `.env.local`. */
const SESSION_SECRET = "world-portal-dev-session-secret";

const event = {} as NextFetchEvent;
/**
 * `cookie` is `name=value`. Set through `request.cookies`, not a `cookie`
 * header: the test DOM's `Headers` drops that header as browser-forbidden.
 */
const request = (path: string, cookie?: string) => {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (cookie) {
    const at = cookie.indexOf("=");
    req.cookies.set(cookie.slice(0, at), cookie.slice(at + 1));
  }
  return req;
};

const adminCookie = () =>
  createSessionToken(
    {
      id: "usr_1",
      name: "Ada Desk",
      email: "ada@example.com",
      role: "MANAGER",
      token: "backend-token",
    },
    SESSION_SECRET,
  ).token;

const agencyCookie = () =>
  createAgencySessionToken(
    {
      id: "agu_1",
      name: "Kemi Owner",
      email: "kemi@example.com",
      role: "owner",
      agencyId: "agc_1",
      agencyName: "Shield Security",
    },
    SESSION_SECRET,
  ).token;

describe("proxy dispatch", () => {
  beforeEach(() => clerkGuard.mockClear());

  it("guards /admin with the console session, never Clerk", async () => {
    const response = await proxy(request("/admin/applications"), event);

    expect(clerkGuard).not.toHaveBeenCalled();
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/admin/login?next=");
  });

  it("guards /agency with the agency session, never Clerk", async () => {
    const response = await proxy(request("/agency/assignments"), event);

    expect(clerkGuard).not.toHaveBeenCalled();
    expect(response?.headers.get("location")).toContain("/agency/login?next=");
  });

  it("lets console API proxies authenticate themselves", async () => {
    await proxy(request("/api/admin/stats"), event);
    await proxy(request("/api/agency/me"), event);

    expect(clerkGuard).not.toHaveBeenCalled();
  });

  it.each(["/apply", "/applicant/applications", "/", "/api/me/applications"])(
    "sends %s through the WorldStreet (Clerk) guard",
    async (path) => {
      await proxy(request(path), event);
      expect(clerkGuard).toHaveBeenCalledTimes(1);
    },
  );
});

describe("proxy keeps the two console sessions apart", () => {
  beforeEach(() => clerkGuard.mockClear());

  it("lets a real admin session into /admin", async () => {
    const response = await proxy(
      request("/admin/applications", `wp_admin_session=${adminCookie()}`),
      event,
    );
    expect(response?.headers.get("location")).toBeNull();
  });

  it("refuses an agency session pasted into the admin cookie", async () => {
    const response = await proxy(
      request("/admin/applications", `wp_admin_session=${agencyCookie()}`),
      event,
    );
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/admin/login?next=");
  });

  it("does not bounce an agency session on /admin/login to the desk", async () => {
    const response = await proxy(
      request("/admin/login", `wp_admin_session=${agencyCookie()}`),
      event,
    );
    expect(response?.headers.get("location")).toBeNull();
  });

  it("lets a real agency session into /agency", async () => {
    const response = await proxy(
      request("/agency/assignments", `wp_agency_session=${agencyCookie()}`),
      event,
    );
    expect(response?.headers.get("location")).toBeNull();
  });

  it("refuses an admin session pasted into the agency cookie", async () => {
    const response = await proxy(
      request("/agency/assignments", `wp_agency_session=${adminCookie()}`),
      event,
    );
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/agency/login?next=");
  });
});
