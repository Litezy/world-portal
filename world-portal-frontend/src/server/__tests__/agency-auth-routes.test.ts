import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The agency session lives in an httpOnly cookie so page scripts can't read
 * it. Echoing the cookie's value in the JSON body would hand it straight back
 * to those scripts, so sign-in and signup set the cookie and return only the
 * user.
 */

const jar = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: jar.set, get: () => undefined }),
}));

const auth = vi.hoisted(() => ({
  authenticateAgency: vi.fn(),
  registerAgency: vi.fn(),
  sendAgencyOtp: vi.fn(),
}));
vi.mock("@/server/agency/auth", () => auth);

const login = await import("@/app/api/agency/auth/login/route");
const signup = await import("@/app/api/agency/auth/signup/route");

const SESSION = "signed-session-value";
const user = {
  id: "agu-1",
  name: "Sample Owner",
  email: "owner@example.com",
  role: "owner",
  agencyId: "ag-1",
  agencyName: "Sample Agency",
};

const post = (path: string, body: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jar.set.mockReset();
  auth.authenticateAgency.mockResolvedValue({ user, token: SESSION, message: null });
  auth.registerAgency.mockResolvedValue({ user, token: SESSION, message: null });
});

function expectCookieOnly(body: unknown) {
  expect(body).toEqual({ data: user });
  expect(JSON.stringify(body)).not.toContain(SESSION);
  expect(jar.set).toHaveBeenCalledWith(
    "wp_agency_session",
    SESSION,
    expect.objectContaining({ httpOnly: true }),
  );
}

describe("agency sign-in and signup keep the session in the cookie", () => {
  it("sign-in sets the cookie and returns no token", async () => {
    const response = await login.POST(
      post("/api/agency/auth/login", { email: "owner@example.com", otp: "123456" }),
    );

    expect(response.status).toBe(200);
    expectCookieOnly(await response.json());
  });

  it("signup sets the cookie and returns no token", async () => {
    const response = await signup.POST(
      post("/api/agency/auth/signup", {
        agencyName: "Sample Agency",
        contactName: "Sample Owner",
        email: "owner@example.com",
        phone: "+15550100",
        countryCode: "US",
        country: "United States",
        otp: "123456",
      }),
    );

    expect(response.status).toBe(201);
    expectCookieOnly(await response.json());
  });
});

/**
 * The cookie's lifetime and the signed session's own expiry are the same
 * number: an 8-hour "not remembered" cookie must not carry a token that stays
 * valid for a week if it is copied out of the browser.
 */
describe("agency session lifetime matches the cookie", () => {
  const EIGHT_HOURS = 60 * 60 * 8;
  const WEEK = 60 * 60 * 24 * 7;

  const cookieMaxAge = () => (jar.set.mock.calls[0][2] as { maxAge: number }).maxAge;

  it.each([
    [undefined, EIGHT_HOURS],
    [false, EIGHT_HOURS],
    [true, WEEK],
  ])("sign-in with remember=%s signs and sets %i seconds", async (remember, ttl) => {
    await login.POST(
      post("/api/agency/auth/login", {
        email: "owner@example.com",
        otp: "123456",
        ...(remember === undefined ? {} : { remember }),
      }),
    );

    expect(auth.authenticateAgency).toHaveBeenLastCalledWith(
      "owner@example.com",
      "123456",
      expect.any(Object),
      { ttlSeconds: ttl },
    );
    expect(cookieMaxAge()).toBe(ttl);
  });

  it("signup signs and sets the same lifetime", async () => {
    await signup.POST(
      post("/api/agency/auth/signup", {
        agencyName: "Sample Agency",
        contactName: "Sample Owner",
        email: "owner@example.com",
        phone: "+15550100",
        countryCode: "US",
        country: "United States",
        otp: "123456",
      }),
    );

    const [, , options] = auth.registerAgency.mock.lastCall as [
      unknown,
      unknown,
      { ttlSeconds: number },
    ];
    expect(options.ttlSeconds).toBe(cookieMaxAge());
  });
});
