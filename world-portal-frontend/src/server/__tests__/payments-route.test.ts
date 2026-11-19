import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The basket checkout. The API now opens a package payment only for a signed-in
 * WorldStreet applicant and files it under their verified email, so this route
 * forwards the session token and never vouches for anyone itself.
 */

const auth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { POST } = await import("@/app/api/payments/checkout-package/route");

const basket = {
  email: "victim@example.com",
  items: [{ type: "HIRE", title: "Interpreter", amount: 120 }],
  totalAmount: 120,
};

const post = (body: unknown) =>
  new Request("http://localhost:3000/api/payments/checkout-package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/payments/checkout-package", () => {
  beforeEach(() => {
    auth.mockReset();
    fetchMock.mockReset();
  });

  it("refuses without a WorldStreet session and never calls the API", async () => {
    auth.mockResolvedValue({ userId: null, getToken: vi.fn() });

    const response = await POST(post(basket));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks out as the signed-in applicant, by session token", async () => {
    auth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("session-jwt"),
    });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { transactionRef: "TXN-PKG-1" } }),
        { status: 201 },
      ),
    );

    const response = await POST(post(basket));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ transactionRef: "TXN-PKG-1" });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(new URL(String(url)).pathname).toMatch(/\/payments\/checkout-package$/);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer session-jwt");
    expect(headers["x-service-key"]).toBeUndefined();
  });

  it("passes the API's refusal through", async () => {
    auth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("session-jwt"),
    });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message:
            "Add and verify an email address on your WorldStreet account before applying.",
        }),
        { status: 403 },
      ),
    );

    const response = await POST(post(basket));
    expect(response.status).toBe(403);
  });

  it("refuses a body that is not JSON", async () => {
    auth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("session-jwt"),
    });
    const response = await POST(
      new Request("http://localhost:3000/api/payments/checkout-package", {
        method: "POST",
        body: "not json",
      }),
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
