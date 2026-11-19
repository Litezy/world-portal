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

/** A production configuration that passes every check; tests break one thing. */
const PRODUCTION = {
  NODE_ENV: "production",
  ADMIN_PASSWORD: "a-real-production-password",
  SESSION_SECRET: "a-real-production-session-secret-of-32+",
  SERVICE_AUTH_KEY: "a-real-production-service-key-of-32-chars+",
};

/** Everything serverEnv() logged before throwing, as one searchable string. */
function loggedErrors(spy: ReturnType<typeof vi.spyOn>) {
  return JSON.stringify(spy.mock.calls);
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

  it("no longer requires the unused AGENCY_PASSWORD in production", async () => {
    // Agencies sign in with an emailed code; nothing reads AGENCY_PASSWORD.
    const unset = await loadServerEnv({ ...PRODUCTION, AGENCY_PASSWORD: "" });
    expect(() => unset()).not.toThrow();
    const devDefault = await loadServerEnv({
      ...PRODUCTION,
      AGENCY_PASSWORD: "worldportal-agency",
    });
    expect(() => devDefault()).not.toThrow();
  });

  it("accepts real production values", async () => {
    const serverEnv = await loadServerEnv({
      ...PRODUCTION,
      AGENCY_PASSWORD: "a-real-agency-password",
    });
    expect(serverEnv().SESSION_SECRET).toBe(PRODUCTION.SESSION_SECRET);
    expect(serverEnv().SERVICE_AUTH_KEY).toBe(PRODUCTION.SERVICE_AUTH_KEY);
  });

  describe("ADMIN_PASSWORD strength in production", () => {
    it("refuses one shorter than 16 characters, and says why", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const serverEnv = await loadServerEnv({
        ...PRODUCTION,
        ADMIN_PASSWORD: "fifteen-chars!!",
      });
      expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
      expect(loggedErrors(error)).toMatch(
        /ADMIN_PASSWORD must be at least 16 characters/,
      );
    });

    it("accepts one of exactly 16 characters", async () => {
      const serverEnv = await loadServerEnv({
        ...PRODUCTION,
        ADMIN_PASSWORD: "sixteen-chars!!!",
      });
      expect(serverEnv().ADMIN_PASSWORD).toBe("sixteen-chars!!!");
    });

    it("still lets development run on a short local password", async () => {
      const serverEnv = await loadServerEnv({
        NODE_ENV: "development",
        ADMIN_PASSWORD: "local-pw",
      });
      expect(serverEnv().ADMIN_PASSWORD).toBe("local-pw");
    });
  });

  describe("SESSION_SECRET strength in production", () => {
    it("refuses one shorter than 32 characters, and says why", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const serverEnv = await loadServerEnv({
        ...PRODUCTION,
        SESSION_SECRET: "a-real-production-secret-value",
      });
      expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
      expect(loggedErrors(error)).toMatch(
        /SESSION_SECRET must be at least 32 characters/,
      );
    });

    it("keeps the development default usable outside production", async () => {
      const serverEnv = await loadServerEnv({ NODE_ENV: "development" });
      expect(serverEnv().SESSION_SECRET).toBe("world-portal-dev-session-secret");
    });
  });

  describe("SERVICE_AUTH_KEY in production", () => {
    it("is required", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const serverEnv = await loadServerEnv({ ...PRODUCTION, SERVICE_AUTH_KEY: "" });
      expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
      expect(loggedErrors(error)).toMatch(/Set SERVICE_AUTH_KEY in production/);
    });

    it("refuses the local development key from .env.example", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const serverEnv = await loadServerEnv({
        ...PRODUCTION,
        SERVICE_AUTH_KEY: "local-dev-service-key-not-for-production",
      });
      expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
      expect(loggedErrors(error)).toMatch(/SERVICE_AUTH_KEY/);
    });

    it("refuses one shorter than 32 characters", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const serverEnv = await loadServerEnv({
        ...PRODUCTION,
        SERVICE_AUTH_KEY: "too-short-for-the-api",
      });
      expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
    });

    it("stays optional in development (local mock auth)", async () => {
      const serverEnv = await loadServerEnv({
        NODE_ENV: "development",
        SERVICE_AUTH_KEY: "",
      });
      expect(serverEnv().SERVICE_AUTH_KEY).toBeUndefined();
    });
  });

  describe("CLIENT_IP_HEADER", () => {
    it("accepts the allowed headers, in any case", async () => {
      const serverEnv = await loadServerEnv({ CLIENT_IP_HEADER: " CF-Connecting-IP " });
      expect(serverEnv().CLIENT_IP_HEADER).toBe("cf-connecting-ip");
    });

    it("refuses a header it does not know, rather than trusting it", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const serverEnv = await loadServerEnv({ CLIENT_IP_HEADER: "x-client-ip" });
      expect(() => serverEnv()).toThrow(/Invalid server environment variables/);
    });
  });
});

describe("applicant env", () => {
  it("still works in production when a console password is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("SESSION_SECRET", PRODUCTION.SESSION_SECRET);
    vi.stubEnv("SERVICE_AUTH_KEY", PRODUCTION.SERVICE_AUTH_KEY);
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
