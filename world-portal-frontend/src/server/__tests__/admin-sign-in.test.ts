import type * as NodeCrypto from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The admin console's sign-in, driven through its route handler: the shared
 * console password is compared in constant time, failed attempts are limited
 * per visitor address and per email, and the token request names the visitor
 * so the API counts them too.
 */

// Watch the comparison without changing it. Source files read a builtin's
// named imports through its `default`, so the spy goes on both.
const crypto = vi.hoisted(() => ({ timingSafeEqual: vi.fn() }));
vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof NodeCrypto>();
  crypto.timingSafeEqual.mockImplementation(actual.timingSafeEqual);
  const watched = { ...actual, timingSafeEqual: crypto.timingSafeEqual };
  return { ...watched, default: watched };
});

const jar = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: jar.set, get: () => undefined }),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { POST: login } = await import("@/app/api/admin/auth/login/route");
const { authenticate } = await import("@/server/auth");
const { resetLoginThrottle } = await import("@/server/auth/login-throttle");

const PASSWORD = "console-password-long-enough";
const FIFTEEN_MINUTES = 15 * 60 * 1000;

type Call = { url: string; headers: Record<string, string> };
let calls: Call[];
let serviceUp: boolean;

function answerAsTheService() {
  fetchMock.mockImplementation(async (url: URL | string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
    });
    if (!serviceUp) {
      return new Response(JSON.stringify({ message: "Service unavailable" }), {
        status: 503,
      });
    }
    const body = String(url).endsWith("/auth/test-token")
      ? { success: true, data: { accessToken: "signed-token" } }
      : {
          success: true,
          data: {
            id: "p1",
            email: "desk@example.com",
            firstName: "Ada",
            lastName: "Obi",
            role: "STAFF",
            isActive: true,
          },
        };
    return new Response(JSON.stringify(body), { status: 200 });
  });
}

function attempt(email: string, password: string, ip = "198.51.100.7") {
  return login(
    new Request("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": ip },
      body: JSON.stringify({ email, password, remember: false }),
    }),
  );
}

beforeEach(() => {
  calls = [];
  serviceUp = true;
  resetLoginThrottle();
  jar.set.mockReset();
  fetchMock.mockReset();
  crypto.timingSafeEqual.mockClear();
  answerAsTheService();
  vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
  vi.stubEnv("WORLD_PORTAL_API_URL", "http://service.test/api");
  vi.stubEnv("VERCEL", undefined);
  vi.stubEnv("CLIENT_IP_HEADER", undefined);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("console password comparison", () => {
  it("compares fixed-length SHA-256 digests with timingSafeEqual", async () => {
    await authenticate("desk@example.com", "wrong-password");

    expect(crypto.timingSafeEqual).toHaveBeenCalled();
    for (const [a, b] of crypto.timingSafeEqual.mock.calls) {
      expect((a as Buffer).length).toBe(32);
      expect((b as Buffer).length).toBe(32);
    }
  });

  it("refuses a wrong password of any length without asking the service", async () => {
    for (const guess of ["x", PASSWORD.slice(0, -1), `${PASSWORD}x`, "y".repeat(500)]) {
      const result = await authenticate("desk@example.com", guess);
      expect(result.token).toBeNull();
    }
    expect(calls).toHaveLength(0);
  });

  it("still accepts the right password", async () => {
    const result = await authenticate("desk@example.com", PASSWORD);
    expect(result.token).toBe("signed-token");
  });
});

describe("failed sign-in limit", () => {
  it("answers 429 with Retry-After after five failures from one address", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await attempt(`person${i}@example.com`, "wrong-password");
      expect(response.status).toBe(401);
    }

    const blocked = await attempt("someone-else@example.com", PASSWORD);

    expect(blocked.status).toBe(429);
    const retryAfter = Number(blocked.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(15 * 60);
    await expect(blocked.json()).resolves.toMatchObject({
      message: expect.stringMatching(/too many/i),
    });
    // Blocked before the password is even looked at, and the service is not asked.
    expect(calls).toHaveLength(0);
  });

  it("answers 429 after five failures for one email, from any address", async () => {
    for (let i = 0; i < 5; i++) {
      await attempt("desk@example.com", "wrong-password", `203.0.113.${i + 1}`);
    }

    const blocked = await attempt("Desk@Example.com", PASSWORD, "203.0.113.99");

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("leaves other people at other addresses alone", async () => {
    for (let i = 0; i < 5; i++) {
      await attempt("desk@example.com", "wrong-password", "203.0.113.1");
    }

    const other = await attempt("other@example.com", PASSWORD, "203.0.113.2");
    expect(other.status).toBe(200);
  });

  it("clears the email's failures on a successful sign-in", async () => {
    const ip = (n: number) => `203.0.113.${n}`;
    for (let i = 1; i <= 4; i++)
      await attempt("desk@example.com", "wrong-password", ip(i));
    expect((await attempt("desk@example.com", PASSWORD, ip(5))).status).toBe(200);

    for (let i = 6; i <= 9; i++)
      await attempt("desk@example.com", "wrong-password", ip(i));
    // Four failures since the success: still allowed to try.
    const next = await attempt("desk@example.com", "wrong-password", ip(10));
    expect(next.status).toBe(401);
  });

  it("opens again once the 15-minute window has passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T10:00:00Z"));
    for (let i = 0; i < 5; i++) await attempt("desk@example.com", "wrong-password");
    expect((await attempt("desk@example.com", PASSWORD)).status).toBe(429);

    vi.setSystemTime(new Date(Date.now() + FIFTEEN_MINUTES + 1000));

    expect((await attempt("desk@example.com", PASSWORD)).status).toBe(200);
  });

  it("does not count an outage against the visitor", async () => {
    serviceUp = false;
    for (let i = 0; i < 6; i++) {
      const response = await attempt("desk@example.com", PASSWORD);
      expect(response.status).not.toBe(429);
    }
    serviceUp = true;
    expect((await attempt("desk@example.com", PASSWORD)).status).toBe(200);
  });

  it("counts attempts that race each other", async () => {
    const responses = await Promise.all(
      Array.from({ length: 12 }, () => attempt("desk@example.com", "wrong-password")),
    );
    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s === 401)).toHaveLength(5);
    expect(statuses.filter((s) => s === 429)).toHaveLength(7);
  });
});

describe("the token request names the visitor", () => {
  it("authenticate() sends the visitor's address on the token call only", async () => {
    await authenticate("desk@example.com", PASSWORD, {
      "x-visitor-ip": "198.51.100.7",
    });

    const tokenCall = calls.find((c) => c.url.endsWith("/auth/test-token"));
    const profileCall = calls.find((c) => c.url.endsWith("/profiles/me"));
    expect(tokenCall?.headers["x-visitor-ip"]).toBe("198.51.100.7");
    expect(profileCall?.headers["x-visitor-ip"]).toBeUndefined();
  });

  it("the sign-in route passes the visitor's address from the trusted header", async () => {
    const response = await attempt("desk@example.com", PASSWORD, "198.51.100.7");

    expect(response.status).toBe(200);
    const tokenCall = calls.find((c) => c.url.endsWith("/auth/test-token"));
    expect(tokenCall?.headers["x-visitor-ip"]).toBe("198.51.100.7");
  });
});
