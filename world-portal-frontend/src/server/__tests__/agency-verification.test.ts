import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Verifying an agency must never read as saved when the service didn't save
 * it. The store used to change its in-memory copy first and return that copy
 * whenever the service failed, so the console said "Verification updated"
 * during an outage.
 */

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

/** The store reads NODE_ENV once, when it loads. */
async function loadStore(nodeEnv: "production" | "development") {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  return import("@/server/agency/store");
}

afterEach(() => {
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

describe("updateAgencyVerification", () => {
  it("returns the agency the service saved, with the id encoded in the URL", async () => {
    const store = await loadStore("production");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "ag/1", verification: "VERIFIED" }), {
        status: 200,
      }),
    );

    const saved = await store.updateAgencyVerification("ag/1", "verified");

    expect(saved).toMatchObject({ id: "ag/1", verification: "verified" });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/agency\/ag%2F1\/verify$/);
  });

  it("in production, treats an unreachable service as an error, not a save", async () => {
    const store = await loadStore("production");
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(store.updateAgencyVerification("ag_1", "verified")).rejects.toThrow();
  });

  it("in production, treats a refused save as an error", async () => {
    const store = await loadStore("production");
    fetchMock.mockResolvedValue(new Response("{}", { status: 502 }));

    await expect(store.updateAgencyVerification("ag_1", "verified")).rejects.toThrow(
      /not saved/,
    );
  });

  it("in production, reports an agency the service doesn't know as not found", async () => {
    const store = await loadStore("production");
    fetchMock.mockResolvedValue(new Response("{}", { status: 404 }));

    await expect(
      store.updateAgencyVerification("ag_1", "verified"),
    ).resolves.toBeNull();
  });

  it("in development, falls back to the fixtures, which never invent an agency", async () => {
    const store = await loadStore("development");
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      store.updateAgencyVerification("no-such-agency", "verified"),
    ).resolves.toBeNull();
  });
});
