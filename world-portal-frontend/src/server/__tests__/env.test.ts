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

  it("refuses the development agency password in production", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const serverEnv = await loadServerEnv({
      NODE_ENV: "production",
      ADMIN_PASSWORD: "a-real-production-password",
      SESSION_SECRET: "a-real-production-secret-value",
      AGENCY_PASSWORD: "worldportal-agency",
    });
    expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
  });

  it("accepts real production values", async () => {
    const serverEnv = await loadServerEnv({
      NODE_ENV: "production",
      ADMIN_PASSWORD: "a-real-production-password",
      SESSION_SECRET: "a-real-production-secret-value",
      AGENCY_PASSWORD: "a-real-agency-password",
    });
    expect(serverEnv().SESSION_SECRET).toBe("a-real-production-secret-value");
  });
});

describe("applicant env", () => {
  it("still works in production when a console password is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PASSWORD", "a-real-admin-password");
    vi.stubEnv("SESSION_SECRET", "a-real-production-secret-value");
    vi.stubEnv("AGENCY_PASSWORD", "");
    vi.stubEnv("SIRA_API_KEY", "sira-key");
    const { serverEnv, applicantEnv } = await import("@/config/env");

    // The consoles refuse to run — that is their guard doing its job…
    expect(() => serverEnv()).toThrow(/Invalid server environment/);
    // …but applicant sign-up, "My applications" and Vivid are not affected.
    expect(applicantEnv()).toMatchObject({
      SIRA_API_KEY: "sira-key",
      VIVID_REQUIRE_SUBSCRIPTION: "false",
    });
  });
});
