import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { backend } from "@/server/api/backend";
import { serviceKeyHeaders, visitorIpHeaders } from "@/server/api/service-key";

/**
 * Routes the website's server calls on a visitor's behalf (the agency portal,
 * the console's helpers) are closed to the public: the API only answers this
 * server, which proves itself with SERVICE_AUTH_KEY as `x-service-key`. The key
 * is read on the server and must never ride along on an ordinary call.
 */
const KEY = "k".repeat(40);

describe("serviceKeyHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("carries the configured key", () => {
    vi.stubEnv("SERVICE_AUTH_KEY", KEY);
    expect(serviceKeyHeaders()).toEqual({ "x-service-key": KEY });
  });

  it("is empty when no key is configured", () => {
    vi.stubEnv("SERVICE_AUTH_KEY", "");
    expect(serviceKeyHeaders()).toEqual({});
  });

  it("is empty when the configured key is too short to be accepted", () => {
    vi.stubEnv("SERVICE_AUTH_KEY", "short");
    expect(serviceKeyHeaders()).toEqual({});
  });
});

describe("backend({ service: true })", () => {
  let sent: Record<string, string>[];

  beforeEach(() => {
    sent = [];
    vi.stubEnv("WORLD_PORTAL_API_URL", "http://service.test/api");
    vi.stubEnv("SERVICE_AUTH_KEY", KEY);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: URL | string, init?: RequestInit) => {
        sent.push((init?.headers ?? {}) as Record<string, string>);
        return new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends the service key when asked to", async () => {
    await backend("/agency/a1", { service: true });
    expect(sent[0]["x-service-key"]).toBe(KEY);
  });

  it("does not send the service key on an ordinary call", async () => {
    await backend("/agency/a1");
    await backend("/visa-documentation", { token: "desk-token" });
    expect(sent[0]["x-service-key"]).toBeUndefined();
    expect(sent[1]["x-service-key"]).toBeUndefined();
    expect(sent[1].Authorization).toBe("Bearer desk-token");
  });
});

describe("visitorIpHeaders", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://site.test/api/otp/send", { headers });

  it("names the visitor from the proxy's X-Real-IP", () => {
    expect(visitorIpHeaders(req({ "x-real-ip": "198.51.100.7" }))).toEqual({
      "x-visitor-ip": "198.51.100.7",
    });
  });

  it("otherwise takes the last X-Forwarded-For hop, which the client cannot forge", () => {
    expect(
      visitorIpHeaders(req({ "x-forwarded-for": "1.2.3.4, 198.51.100.8" })),
    ).toEqual({ "x-visitor-ip": "198.51.100.8" });
  });

  it("sends nothing when the address is missing or malformed", () => {
    expect(visitorIpHeaders(req({}))).toEqual({});
    expect(visitorIpHeaders(req({ "x-real-ip": "not-an-ip" }))).toEqual({});
  });
});

/**
 * Which header names the visitor depends on what sits in front of this server:
 * a header no proxy overwrites is whatever the client typed. CLIENT_IP_HEADER
 * picks the one the deployment's own edge sets; unset, the default follows the
 * platform.
 */
describe("visitorIpHeaders and CLIENT_IP_HEADER", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://site.test/api/otp/send", { headers });

  const ALL = {
    "x-vercel-forwarded-for": "203.0.113.1",
    "cf-connecting-ip": "203.0.113.2",
    "x-real-ip": "203.0.113.3",
    "x-forwarded-for": "198.51.100.99, 203.0.113.4",
  };

  beforeEach(() => {
    vi.stubEnv("VERCEL", undefined);
    vi.stubEnv("CLIENT_IP_HEADER", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("unset, off Vercel (Coolify behind Traefik)", () => {
    it("prefers X-Real-IP, ignoring headers only other edges set", () => {
      expect(visitorIpHeaders(req(ALL))).toEqual({ "x-visitor-ip": "203.0.113.3" });
    });

    it("falls back to the last X-Forwarded-For hop", () => {
      expect(
        visitorIpHeaders(req({ "x-forwarded-for": "1.2.3.4, 203.0.113.4" })),
      ).toEqual({ "x-visitor-ip": "203.0.113.4" });
    });

    it("never trusts a client-typed Vercel or Cloudflare header", () => {
      expect(
        visitorIpHeaders(
          req({
            "x-vercel-forwarded-for": "203.0.113.1",
            "cf-connecting-ip": "203.0.113.2",
          }),
        ),
      ).toEqual({});
    });
  });

  describe("unset, on Vercel", () => {
    beforeEach(() => vi.stubEnv("VERCEL", "1"));

    it("prefers x-vercel-forwarded-for", () => {
      expect(visitorIpHeaders(req(ALL))).toEqual({ "x-visitor-ip": "203.0.113.1" });
    });

    it("falls back to X-Real-IP", () => {
      expect(
        visitorIpHeaders(
          req({ "x-real-ip": "203.0.113.3", "x-forwarded-for": "203.0.113.4" }),
        ),
      ).toEqual({ "x-visitor-ip": "203.0.113.3" });
    });

    it("does not fall back to X-Forwarded-For", () => {
      expect(visitorIpHeaders(req({ "x-forwarded-for": "203.0.113.4" }))).toEqual({});
    });
  });

  it.each([
    ["x-vercel-forwarded-for", "203.0.113.1"],
    ["cf-connecting-ip", "203.0.113.2"],
    ["x-real-ip", "203.0.113.3"],
    ["x-forwarded-for", "203.0.113.4"],
  ])("set to %s, reads only that header", (header, expected) => {
    vi.stubEnv("CLIENT_IP_HEADER", header);
    expect(visitorIpHeaders(req(ALL))).toEqual({ "x-visitor-ip": expected });
  });

  it("set, does not fall back to another header when that one is missing", () => {
    vi.stubEnv("CLIENT_IP_HEADER", "cf-connecting-ip");
    expect(visitorIpHeaders(req({ "x-real-ip": "203.0.113.3" }))).toEqual({});
  });

  it("wins over the Vercel default", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CLIENT_IP_HEADER", "cf-connecting-ip");
    expect(visitorIpHeaders(req(ALL))).toEqual({ "x-visitor-ip": "203.0.113.2" });
  });

  it("ignores case and surrounding space in the setting", () => {
    vi.stubEnv("CLIENT_IP_HEADER", "  CF-Connecting-IP ");
    expect(visitorIpHeaders(req(ALL))).toEqual({ "x-visitor-ip": "203.0.113.2" });
  });

  it("sends nothing for an unknown setting rather than guessing", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("CLIENT_IP_HEADER", "x-client-ip");
    expect(visitorIpHeaders(req({ ...ALL, "x-client-ip": "203.0.113.9" }))).toEqual({});
  });

  it("sends only a well-formed address", () => {
    vi.stubEnv("CLIENT_IP_HEADER", "cf-connecting-ip");
    for (const value of [
      "not-an-ip",
      "203.0.113.2, 203.0.113.5",
      "203.0.113.2:443",
      "",
    ]) {
      expect(visitorIpHeaders(req({ "cf-connecting-ip": value })), value).toEqual({});
    }
    expect(visitorIpHeaders(req({ "cf-connecting-ip": "2001:db8::7" }))).toEqual({
      "x-visitor-ip": "2001:db8::7",
    });
  });
});
