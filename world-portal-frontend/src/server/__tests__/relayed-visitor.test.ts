import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Calls this server relays for a visitor (OTP send and verify, agency sign-in
 * codes, the basket checkout) all reach the API from this server's one
 * address. They carry the service key plus the visitor's own IP, so the API
 * rate-limits each visitor rather than the whole site at once: without that,
 * five OTP requests from anyone would lock everyone out for 15 minutes.
 */
const KEY = "k".repeat(40);
const VISITOR = "198.51.100.7";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
vi.stubEnv("SERVICE_AUTH_KEY", KEY);
vi.stubEnv("WORLD_PORTAL_API_URL", "http://service.test/api");

const { POST: otpSend } = await import("@/app/api/otp/send/route");
const { POST: otpVerify } = await import("@/app/api/otp/verify/route");
const { POST: checkout } = await import("@/app/api/payments/checkout-package/route");
const { sendAgencyOtp, verifyAgencyOtp } = await import("@/server/agency/auth");

const fromVisitor = (path: string, body: unknown) =>
  new Request(`http://site.test${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": VISITOR },
    body: JSON.stringify(body),
  });

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 });

function headersOfCall(path: string): Record<string, string> {
  const call = fetchMock.mock.calls.find(([url]) => String(url).includes(path));
  expect(call, `expected a call to ${path}`).toBeTruthy();
  return (call![1]?.headers ?? {}) as Record<string, string>;
}

describe("calls relayed for a visitor", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    auth.mockReset();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("OTP send carries the service key and the visitor's IP", async () => {
    fetchMock.mockResolvedValue(ok({ success: true }));
    await otpSend(fromVisitor("/api/otp/send", { email: "ada@example.com" }));
    const headers = headersOfCall("/otp/send");
    expect(headers["x-service-key"]).toBe(KEY);
    expect(headers["x-visitor-ip"]).toBe(VISITOR);
  });

  it("OTP verify carries the service key and the visitor's IP", async () => {
    fetchMock.mockResolvedValue(ok({ verified: true }));
    await otpVerify(
      fromVisitor("/api/otp/verify", { email: "ada@example.com", code: "123456" }),
    );
    const headers = headersOfCall("/otp/verify");
    expect(headers["x-service-key"]).toBe(KEY);
    expect(headers["x-visitor-ip"]).toBe(VISITOR);
  });

  it("the basket checkout carries them alongside the applicant's token", async () => {
    auth.mockResolvedValue({
      userId: "user_1",
      getToken: vi.fn(async () => "clerk-token"),
    });
    fetchMock.mockResolvedValue(ok({ transactionRef: "TXN-1" }));
    await checkout(
      fromVisitor("/api/payments/checkout-package", {
        items: [{ type: "HIRE", title: "Interpreter", professionalId: "p1" }],
      }),
    );
    const headers = headersOfCall("/payments/checkout-package");
    expect(headers.Authorization).toBe("Bearer clerk-token");
    expect(headers["x-service-key"]).toBe(KEY);
    expect(headers["x-visitor-ip"]).toBe(VISITOR);
  });

  it("agency sign-in codes are sent with the key and the visitor's IP", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("/otp/send")
        ? ok({ success: true })
        : ok({ id: "ag-1", email: "owner@agency.test", users: [] }),
    );
    await sendAgencyOtp("owner@agency.test", "login", { "x-visitor-ip": VISITOR });
    const headers = headersOfCall("/otp/send");
    expect(headers["x-service-key"]).toBe(KEY);
    expect(headers["x-visitor-ip"]).toBe(VISITOR);
  });

  it("agency code checks are sent with the key and the visitor's IP", async () => {
    fetchMock.mockResolvedValue(ok({ verified: true }));
    await verifyAgencyOtp("owner@agency.test", "123456", { "x-visitor-ip": VISITOR });
    const headers = headersOfCall("/otp/verify");
    expect(headers["x-service-key"]).toBe(KEY);
    expect(headers["x-visitor-ip"]).toBe(VISITOR);
  });
});
