import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authenticateAgency, registerAgency } from "@/server/agency/auth";

/**
 * The signed agency session expires when the caller says, so the routes can
 * make it match the cookie they set.
 */
const fetchMock = vi.fn();

const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ success: true, data }), { status });

const expiryOf = (token: string) =>
  JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"))
    .exp as number;

const now = () => Math.floor(Date.now() / 1000);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("agency session expiry", () => {
  it("sign-in signs the session for the lifetime asked for", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("/otp/verify")
        ? ok({ verified: true })
        : ok({
            id: "ag-1",
            name: "Sample Agency",
            email: "owner@agency.test",
            users: [],
          }),
    );

    const { token } = await authenticateAgency(
      "owner@agency.test",
      "123456",
      {},
      {
        ttlSeconds: 60 * 60 * 8,
      },
    );

    expect(expiryOf(token!) - now()).toBeGreaterThan(60 * 60 * 8 - 5);
    expect(expiryOf(token!) - now()).toBeLessThanOrEqual(60 * 60 * 8);
  });

  it("signup signs the session for the lifetime asked for", async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/otp/verify")) return ok({ verified: true });
      if (init?.method === "POST") return ok({ id: "ag-2", name: "New Agency" }, 201);
      return ok([]);
    });

    const { token } = await registerAgency(
      {
        agencyName: "New Agency",
        contactName: "New Owner",
        email: "new@agency.test",
        phone: "+15550100",
        countryCode: "GB",
        country: "United Kingdom",
        otp: "123456",
      },
      {},
      { ttlSeconds: 60 * 60 * 3 },
    );

    expect(expiryOf(token!) - now()).toBeGreaterThan(60 * 60 * 3 - 5);
    expect(expiryOf(token!) - now()).toBeLessThanOrEqual(60 * 60 * 3);
  });
});
