import { describe, expect, it, vi } from "vitest";
import { authenticateAgency, registerAgency } from "../agency/auth";

describe("Agency Auth", () => {
  it("authenticates seed user with correct password", async () => {
    const { user, message } = await authenticateAgency(
      "adaeze@sentinelridge.example",
      "worldportal-agency",
    );
    expect(message).toBeNull();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("adaeze@sentinelridge.example");
    expect(user?.role).toBe("owner");
  });

  it("fails authentication with invalid password", async () => {
    const { user, message } = await authenticateAgency(
      "adaeze@sentinelridge.example",
      "WrongPassword123",
    );
    expect(user).toBeNull();
    expect(message).toBe("That email and password do not match.");
  });

  it("fails authentication for unknown email", async () => {
    const { user, message } = await authenticateAgency(
      "unknown.email@domain.com",
      "Password@2",
    );
    expect(user).toBeNull();
    expect(message).toBe("That email and password do not match.");
  });

  it("registers a new agency successfully", async () => {
    const testEmail = `new.agency.${Date.now()}@test.com`;
    const { user, message } = await registerAgency({
      agencyName: "Unique Test Agency",
      contactName: "Bob Builder",
      email: testEmail,
      phone: "+15550199",
      countryCode: "US",
      country: "United States",
      password: "Password@2",
    });

    expect(message).toBeNull();
    expect(user).not.toBeNull();
    expect(user?.email).toBe(testEmail);
    expect(user?.agencyName).toBe("Unique Test Agency");
  });

  it("prevents registering duplicate agency email", async () => {
    const { user, message } = await registerAgency({
      agencyName: "Duplicate Sentinel Ridge",
      contactName: "Adaeze",
      email: "adaeze@sentinelridge.example",
      phone: "+15550199",
      countryCode: "US",
      country: "United States",
      password: "Password@2",
    });

    expect(user).toBeNull();
    expect(message).toBe("An agency is already listed with that email. Sign in instead.");
  });
});
