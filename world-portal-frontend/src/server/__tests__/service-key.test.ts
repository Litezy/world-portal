import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { backend } from "@/server/api/backend";
import { serviceKeyHeaders } from "@/server/api/service-key";

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
