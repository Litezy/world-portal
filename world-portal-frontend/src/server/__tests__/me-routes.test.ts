import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { GET: getApplications } = await import("@/app/api/me/applications/route");
const { GET: getHires } = await import("@/app/api/me/hires/route");

describe("/api/me routes", () => {
  beforeEach(() => {
    auth.mockReset();
    fetchMock.mockReset();
  });

  it("refuses without a WorldStreet session and never calls the API", async () => {
    auth.mockResolvedValue({ userId: null, getToken: vi.fn() });

    const response = await getApplications();

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the API as the signed-in applicant — by token, not by email", async () => {
    auth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("session-jwt"),
    });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [{ id: "v1" }] }), {
        status: 200,
      }),
    );

    const response = await getApplications();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "v1" }]);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toMatch(/\/me\/applications$/);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer session-jwt",
    );
  });

  it("passes the API's refusal through, e.g. a suspended applicant", async () => {
    auth.mockResolvedValue({
      userId: "user_123",
      getToken: vi.fn().mockResolvedValue("session-jwt"),
    });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Your E-Embassy access is suspended." }), {
        status: 403,
      }),
    );

    const response = await getHires();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Your E-Embassy access is suspended.",
    });
  });
});
