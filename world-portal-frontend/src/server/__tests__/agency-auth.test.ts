import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authenticateAgency,
  registerAgency,
  sendAgencyOtp,
  verifyAgencyOtp,
} from "../agency/auth";

describe("Agency Auth (Passwordless OTP)", () => {
  const registeredAgencies: { id: string; email: string }[] = [];
  const deliveredCodes = new Map<string, string>();

  beforeEach(() => {
    registeredAgencies.length = 0;
    deliveredCodes.clear();

    // Mock fetch for NestJS backend endpoints
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
        if (url.endsWith("/otp/send")) {
          const { email } = JSON.parse(String(options?.body));
          deliveredCodes.set(email, "123456");
          return { ok: true, json: async () => ({ data: { success: true } }) };
        }
        if (url.endsWith("/otp/verify")) {
          const { email, code } = JSON.parse(String(options?.body));
          const verified = deliveredCodes.get(email) === code;
          if (verified) deliveredCodes.delete(email);
          return { ok: verified, json: async () => ({ data: { verified } }) };
        }
        if (typeof url === "string" && url.includes("/agency")) {
          if (options?.method === "POST") {
            const body = JSON.parse(String(options?.body));
            const newAgency = {
              id: `ag-test-${Date.now()}`,
              name: body.name,
              email: body.email,
              phone: body.phone,
              country: body.country,
              countryCode: body.countryCode,
              users: [
                { id: `agu-test-${Date.now()}`, name: body.name, email: body.email },
              ],
            };
            registeredAgencies.push(newAgency);
            return {
              ok: true,
              json: async () => ({ data: newAgency }),
            };
          }

          if (url.includes("search=")) {
            const searchParam = new URL(url).searchParams.get("search")?.toLowerCase();
            const matches = registeredAgencies.filter(
              (a) => a.email.toLowerCase() === searchParam,
            );
            return {
              ok: true,
              json: async () => ({ data: matches }),
            };
          }

          const emailOrId = decodeURIComponent(
            url.split("/agency/")[1] || "",
          ).toLowerCase();
          const match = registeredAgencies.find(
            (a) =>
              a.email.toLowerCase() === emailOrId || a.id.toLowerCase() === emailOrId,
          );

          if (match) {
            return {
              ok: true,
              json: async () => ({ data: match }),
            };
          }

          return {
            ok: false,
            status: 404,
            json: async () => ({ message: "Not found" }),
          };
        }

        return { ok: false, status: 400, json: async () => ({}) };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends OTP and allows verifying with 000000 bypass code", async () => {
    const res = await sendAgencyOtp("test.otp@example.com");
    expect(res.success).toBe(true);
    expect(res.message).toContain("Verification code sent");

    const isValid = await verifyAgencyOtp("test.otp@example.com", "000000");
    expect(isValid).toBe(true);
  });

  it("sends through the backend and verifies the delivered code once", async () => {
    expect((await sendAgencyOtp(" Mailbox@Example.com ")).success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/otp/send"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "mailbox@example.com", purpose: "AGENCY_AUTH" }),
        cache: "no-store",
      }),
    );
    expect(await verifyAgencyOtp("mailbox@example.com", "999999")).toBe(false);
    expect(await verifyAgencyOtp(" Mailbox@Example.com ", "123456")).toBe(true);
    expect(await verifyAgencyOtp("mailbox@example.com", "123456")).toBe(false);
  });

  it.each([503, 200])(
    "does not claim delivery when the backend reports failure (%s)",
    async (status) => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { success: false } }), { status }),
      );
      expect(await sendAgencyOtp("failure@example.com")).toMatchObject({
        success: false,
        status: 503,
      });
    },
  );

  it("handles network failure during sending and verification", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    expect((await sendAgencyOtp("offline@example.com")).success).toBe(false);
    expect(await verifyAgencyOtp("offline@example.com", "123456")).toBe(false);
  });

  // Whether an email has an agency is told only to someone who has proved they
  // read that mailbox, by entering the code. Asking for a code answers the same
  // either way, so the form can't be used to test which businesses are listed.
  it("answers a sign-in code request the same whether or not the agency exists", async () => {
    const existingEmail = `registered.login.${Date.now()}@test.com`;
    await registerAgency({
      agencyName: "Existing Agency",
      contactName: "Owner",
      email: existingEmail,
      phone: "+15550199",
      countryCode: "US",
      country: "United States",
      otp: "000000",
    });

    const known = await sendAgencyOtp(existingEmail, "login");
    const unknown = await sendAgencyOtp("unknown.email@domain.com", "login");

    expect(known).toEqual(unknown);
    expect(known).toEqual({
      success: true,
      message: "If an agency is registered with that email, a code is on its way.",
    });
    // Only a real account is sent a code.
    expect(deliveredCodes.has(existingEmail)).toBe(true);
    expect(deliveredCodes.has("unknown.email@domain.com")).toBe(false);
  });

  it("answers a signup code request the same whether or not the email is taken", async () => {
    const takenEmail = `registered.signup.${Date.now()}@test.com`;
    const freshEmail = `fresh.signup.${Date.now()}@test.com`;
    const signupWith = (email: string, otp: string) =>
      registerAgency({
        agencyName: "Existing Agency",
        contactName: "Owner",
        email,
        phone: "+15550199",
        countryCode: "US",
        country: "United States",
        otp,
      });
    await signupWith(takenEmail, "000000");

    const taken = await sendAgencyOtp(takenEmail, "signup");
    const fresh = await sendAgencyOtp(freshEmail, "signup");

    expect(taken).toEqual({
      success: true,
      message: `Verification code sent to ${takenEmail}.`,
    });
    expect(fresh).toEqual({
      success: true,
      message: `Verification code sent to ${freshEmail}.`,
    });
    // The taken email's owner learns the agency is listed only after entering
    // the code that went to their own mailbox.
    const again = await signupWith(takenEmail, deliveredCodes.get(takenEmail) ?? "");
    expect(again.message).toBe(
      "An agency is already listed with that email. Sign in instead.",
    );
  });

  it("does not claim a sign-in code went out when the agency lookup fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));

    expect(await sendAgencyOtp("owner@example.com", "login")).toMatchObject({
      success: false,
      status: 503,
    });
  });

  it("fails authentication with invalid OTP code", async () => {
    const { user, token, message } = await authenticateAgency(
      "test.otp@example.com",
      "999999",
    );
    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(message).toBe("Invalid or expired verification code.");
  });

  it("registers a new agency successfully and issues a JWT token", async () => {
    const testEmail = `new.agency.${Date.now()}@test.com`;
    const { user, token, message } = await registerAgency({
      agencyName: "Unique Test Agency",
      contactName: "Bob Builder",
      email: testEmail,
      phone: "+15550199",
      countryCode: "US",
      country: "United States",
      otp: "000000",
    });

    expect(message).toBeNull();
    expect(user).not.toBeNull();
    expect(token).not.toBeNull();
    expect(typeof token).toBe("string");
    expect(user?.email).toBe(testEmail);
    expect(user?.agencyName).toBe("Unique Test Agency");
  });

  it("authenticates registered agency with 000000 OTP and returns user and token", async () => {
    const testEmail = `auth.test.${Date.now()}@test.com`;
    await registerAgency({
      agencyName: "Auth Test Agency",
      contactName: "Auth User",
      email: testEmail,
      phone: "+15550199",
      countryCode: "US",
      country: "United States",
      otp: "000000",
    });

    const { user, token, message } = await authenticateAgency(testEmail, "000000");

    expect(message).toBeNull();
    expect(user).not.toBeNull();
    expect(token).not.toBeNull();
    expect(user?.email).toBe(testEmail);
  });

  it("prevents registering duplicate agency email", async () => {
    const testEmail = `dup.agency.${Date.now()}@test.com`;
    await registerAgency({
      agencyName: "Initial Agency",
      contactName: "First User",
      email: testEmail,
      phone: "+15550199",
      countryCode: "US",
      country: "United States",
      otp: "000000",
    });

    const { user, token, message } = await registerAgency({
      agencyName: "Duplicate Agency",
      contactName: "Second User",
      email: testEmail,
      phone: "+15550199",
      countryCode: "US",
      country: "United States",
      otp: "000000",
    });

    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(message).toBe(
      "An agency is already listed with that email. Sign in instead.",
    );
  });
});
