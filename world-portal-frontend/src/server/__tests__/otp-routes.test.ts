import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /track verifies its one-time code through this site's `/api/otp/verify`.
 * The API's answer carries the lookup token the status lookup needs, so the
 * proxy must hand it back to the browser untouched.
 */

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { POST: verify } = await import("@/app/api/otp/verify/route");
const { POST: send } = await import("@/app/api/otp/send/route");

const post = (path: string, body: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

/** The JSON body the relay sent to the API. */
const forwarded = () => JSON.parse(String(fetchMock.mock.calls[0][1]?.body));

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 });

describe("POST /api/otp/verify", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("passes the lookup token back to the browser", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { verified: true, email: "ada@example.com", lookupToken: "lookup-jwt" },
        }),
        { status: 200 },
      ),
    );

    const response = await verify(
      new Request("http://localhost:3000/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com", code: "123456" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      verified: true,
      lookupToken: "lookup-jwt",
    });
  });

  it("passes a refused code through as an error", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid verification code." }), {
        status: 400,
      }),
    );

    const response = await verify(
      new Request("http://localhost:3000/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com", code: "000000" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});

/**
 * Both relays carry this server's service key, so the API trusts them more than
 * a stranger. They forward only the fields the public flow needs, checked
 * here first, rather than whatever the browser posted.
 */
describe("POST /api/otp/send validation", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(ok({ success: true }));
  });

  it("forwards only the email and a public purpose", async () => {
    const response = await send(
      post("/api/otp/send", {
        email: "Ada@Example.com",
        purpose: "APPLICATION_SUBMISSION",
        code: "000000",
        profileId: "p1",
      }),
    );

    expect(response.status).toBe(200);
    expect(forwarded()).toEqual({
      email: "ada@example.com",
      purpose: "APPLICATION_SUBMISSION",
    });
  });

  it("forwards just the email when no purpose is given", async () => {
    await send(post("/api/otp/send", { email: "ada@example.com" }));
    expect(forwarded()).toEqual({ email: "ada@example.com" });
  });

  it.each([
    [{}],
    [{ email: "not-an-email" }],
    [{ email: ["ada@example.com"] }],
    [{ email: "ada@example.com", purpose: "AGENCY_AUTH" }],
    [{ email: "ada@example.com", purpose: "anything-else" }],
  ])("answers 422 for %j and asks the API nothing", async (body) => {
    const response = await send(post("/api/otp/send", body));
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 400 for a body that isn't JSON", async () => {
    const response = await send(post("/api/otp/send", "not json"));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/otp/verify validation", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(ok({ verified: true, lookupToken: "lookup-jwt" }));
  });

  it("forwards only the email and the code", async () => {
    await verify(
      post("/api/otp/verify", {
        email: "Ada@Example.com",
        code: " 123456 ",
        purpose: "AGENCY_AUTH",
        lookupToken: "forged",
      }),
    );
    expect(forwarded()).toEqual({ email: "ada@example.com", code: "123456" });
  });

  it.each([
    [{ email: "ada@example.com" }],
    [{ email: "ada@example.com", code: "12345" }],
    [{ email: "ada@example.com", code: "1234567" }],
    [{ email: "ada@example.com", code: "12a456" }],
    [{ email: "ada@example.com", code: 123456 }],
    [{ email: "nope", code: "123456" }],
  ])("answers 422 for %j and asks the API nothing", async (body) => {
    const response = await verify(post("/api/otp/verify", body));
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
