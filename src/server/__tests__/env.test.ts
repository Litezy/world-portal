import { afterEach, describe, expect, it, vi } from "vitest";

async function loadServerEnv(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", overrides.NODE_ENV ?? "development");
  for (const [key, value] of Object.entries(overrides)) {
    if (key !== "NODE_ENV") vi.stubEnv(key, value as string);
  }
  const { serverEnv } = await import("@/config/env");
  return serverEnv;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("server env", () => {
  it("falls back to the development console credentials outside production", async () => {
    const serverEnv = await loadServerEnv({ NODE_ENV: "development" });
    expect(serverEnv().ADMIN_EMAIL).toBe("admin@worldportal.travel");
  });

  it("refuses the development password in production", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const serverEnv = await loadServerEnv({
      NODE_ENV: "production",
      ADMIN_PASSWORD: "worldportal",
      SESSION_SECRET: "a-real-production-secret-value",
    });
    expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
  });

  it("refuses the development session secret in production", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const serverEnv = await loadServerEnv({
      NODE_ENV: "production",
      ADMIN_PASSWORD: "a-real-production-password",
      SESSION_SECRET: "world-portal-dev-session-secret",
    });
    expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
  });

  it("accepts real production values", async () => {
    const serverEnv = await loadServerEnv({
      NODE_ENV: "production",
      ADMIN_PASSWORD: "a-real-production-password",
      SESSION_SECRET: "a-real-production-secret-value",
    });
    expect(serverEnv().SESSION_SECRET).toBe("a-real-production-secret-value");
  });
});
