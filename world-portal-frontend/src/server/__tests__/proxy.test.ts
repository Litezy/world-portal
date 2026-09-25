import type { NextFetchEvent } from "next/server";
import { NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

// Stand-in for Clerk: records which requests reach the applicant guard.
const clerkGuard = vi.hoisted(() => vi.fn(() => new Response(null, { status: 204 })));
vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: () => clerkGuard,
}));

const { proxy } = await import("@/proxy");

const event = {} as NextFetchEvent;
const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost:3000"));

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
