import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth }));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { POST: mint } = await import("@/app/api/vivid/sira-session/route");
const { POST: runFunction } = await import("@/app/api/vivid/function/route");
const { hasVividAccess } = await import("@/server/vivid/access");
const { buildVividVoiceInstructions, vividVoiceTools } =
  await import("@/server/vivid/voice-instructions");
const { embassyFunctions } = await import("@/features/vivid/functions");

const post = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const signedIn = () =>
  auth.mockResolvedValue({
    userId: "user_123",
    getToken: vi.fn().mockResolvedValue("jwt"),
  });

/** What Sira really answers — including the vendor fields that must not leak. */
const SIRA_SESSION = {
  id: "sess_abcdef12",
  provider: "gemini",
  model: "gemini-live-2.5-flash",
  voice: "Kore",
  stream_url: "wss://sira.example/v1/voice/sessions/sess_abcdef12/stream",
  token: "single-use",
  connect_within_seconds: 60,
  max_session_seconds: 1200,
  input_audio: { encoding: "pcm_s16le", sample_rate: 16000, channels: 1 },
  output_audio: { encoding: "pcm_s16le", sample_rate: 24000, channels: 1 },
  tools: 16,
};

beforeEach(() => {
  auth.mockReset();
  fetchMock.mockReset();
  vi.stubEnv("SIRA_API_KEY", "sira-test-key");
  vi.stubEnv("VIVID_REQUIRE_SUBSCRIPTION", "false");
});
afterEach(() => vi.unstubAllEnvs());

describe("Vivid access", () => {
  it("is free for any signed-in applicant by default", async () => {
    await expect(hasVividAccess("user_123")).resolves.toBe(true);
    await expect(hasVividAccess("")).resolves.toBe(false);
  });

  it("fails closed when the WorldStreet subscription is required but not wired", async () => {
    vi.stubEnv("VIVID_REQUIRE_SUBSCRIPTION", "true");
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(hasVividAccess("user_123")).resolves.toBe(false);
  });
});

describe("POST /api/vivid/sira-session", () => {
  it("refuses a signed-out caller", async () => {
    auth.mockResolvedValue({ userId: null });
    const response = await mint(post({}));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 402 vivid_locked when access is refused", async () => {
    signedIn();
    vi.stubEnv("VIVID_REQUIRE_SUBSCRIPTION", "true");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await mint(post({}));
    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toMatchObject({ code: "vivid_locked" });
  });

  it("answers 503 when Sira is not configured", async () => {
    signedIn();
    vi.stubEnv("SIRA_API_KEY", "");
    const response = await mint(post({}));
    expect(response.status).toBe(503);
  });

  it("mints with the persona and tools, and returns no vendor fields", async () => {
    signedIn();
    vi.spyOn(console, "info").mockImplementation(() => {});
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(SIRA_SESSION), { status: 201 }),
    );

    const response = await mint(post({ pathname: "/apply", userName: "Ada" }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(
      [
        "connect_within_seconds",
        "id",
        "input_audio",
        "max_session_seconds",
        "output_audio",
        "stream_url",
        "token",
      ].sort(),
    );
    expect(JSON.stringify(body)).not.toMatch(/gemini|kore/i);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sira.vividintelligence.tech/v1/voice/sessions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer sira-test-key",
    );
    const sent = JSON.parse(String(init.body));
    expect(sent.instructions).toContain("E-Embassy");
    expect(sent.instructions).toContain("Visa application");
    expect(sent.tools).toHaveLength(embassyFunctions.length);
  });
});

describe("POST /api/vivid/function", () => {
  it("refuses a signed-out caller", async () => {
    auth.mockResolvedValue({ userId: null });
    expect((await runFunction(post({ name: "getMyApplications" }))).status).toBe(401);
  });

  it("refuses browser-side tools — only server tools run here", async () => {
    signedIn();
    const response = await runFunction(post({ name: "submitApplication", args: {} }));
    expect(response.status).toBe(404);
  });

  it("reads the caller's applications with their own session token", async () => {
    signedIn();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: "v1",
              applicationNo: "VISA-2026-1111",
              type: "VISA",
              status: "EVALUATED",
              paymentStatus: "AWAITING_PAYMENT",
              targetCountry: "Canada",
              totalAmount: "500.00",
              createdAt: "2026-09-20T10:00:00.000Z",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    // A caller cannot smuggle in someone else's token through the args.
    const response = await runFunction(
      post({
        name: "getMyApplications",
        args: { token: "forged", userId: "user_evil" },
      }),
    );
    const body = await response.json();

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toMatch(/\/me\/applications$/);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt");
    expect(body).toMatchObject({
      success: true,
      result: {
        count: 1,
        applications: [
          {
            reference: "VISA-2026-1111",
            destination: "Canada",
            status: "Costed",
            payment: "Awaiting payment",
            fee: 500,
          },
        ],
      },
    });
    expect(body.result.applications[0].next).toMatch(
      /bank transfer quoting VISA-2026-1111/,
    );
  });
});

describe("the voice persona", () => {
  it("keeps Vivid's identity rules and knows it is on E-Embassy", () => {
    const text = buildVividVoiceInstructions({
      pathname: "/passport",
      userName: "Ada",
    });
    expect(text).toContain("You are Vivid");
    expect(text).toMatch(/don't confirm, deny, or name any provider or model/);
    expect(text).toContain("E-Embassy");
    expect(text).toContain("Passport application");
    expect(text).toContain("Name: Ada");
    expect(text).toMatch(/confirmed=true/);
  });

  it("offers Sira exactly the tool list the browser can run", () => {
    expect(vividVoiceTools().map((t) => t.name)).toEqual(
      embassyFunctions.map((f) => f.name),
    );
  });
});
