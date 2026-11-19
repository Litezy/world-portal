import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authenticate } from "@/server/auth";

/**
 * The service only issues console tokens to a caller holding its service key
 * (or to anyone when mock auth is switched on in local dev). The key lives in
 * this server's env and goes out as `x-service-key` — never to the browser.
 */
const SERVICE_KEY = "s".repeat(40);

type Call = { url: string; headers: Record<string, string> };

describe("authenticate (admin console sign-in)", () => {
  let calls: Call[];

  beforeEach(() => {
    calls = [];
    vi.stubEnv("ADMIN_PASSWORD", "console-password");
    vi.stubEnv("WORLD_PORTAL_API_URL", "http://service.test/api");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: URL | string, init?: RequestInit) => {
        calls.push({
          url: String(url),
          headers: (init?.headers ?? {}) as Record<string, string>,
        });
        const body = String(url).endsWith("/auth/test-token")
          ? { success: true, data: { accessToken: "signed-token" } }
          : {
              success: true,
              data: {
                id: "p1",
                email: "staff@example.com",
                firstName: "Ada",
                lastName: "Obi",
                role: "STAFF",
                isActive: true,
              },
            };
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends the service key when asking the service for a token", async () => {
    vi.stubEnv("SERVICE_AUTH_KEY", SERVICE_KEY);

    const result = await authenticate("staff@example.com", "console-password");

    expect(result.token).toBe("signed-token");
    const tokenCall = calls.find((c) => c.url.endsWith("/auth/test-token"));
    expect(tokenCall?.headers["x-service-key"]).toBe(SERVICE_KEY);
  });

  it("never sends the service key on other calls", async () => {
    vi.stubEnv("SERVICE_AUTH_KEY", SERVICE_KEY);

    await authenticate("staff@example.com", "console-password");

    const others = calls.filter((c) => !c.url.endsWith("/auth/test-token"));
    expect(others.length).toBeGreaterThan(0);
    for (const call of others) expect(call.headers["x-service-key"]).toBeUndefined();
  });

  it("sends no key header when none is configured (local mock auth)", async () => {
    await authenticate("staff@example.com", "console-password");

    const tokenCall = calls.find((c) => c.url.endsWith("/auth/test-token"));
    expect(tokenCall).toBeDefined();
    expect(tokenCall?.headers["x-service-key"]).toBeUndefined();
  });

  it("asks the service for nothing when the console password is wrong", async () => {
    vi.stubEnv("SERVICE_AUTH_KEY", SERVICE_KEY);

    const result = await authenticate("staff@example.com", "wrong-password");

    expect(result.token).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
