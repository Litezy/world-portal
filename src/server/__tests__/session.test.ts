import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "@/server/auth/session";
import type { AdminUser } from "@/types";

const SECRET = "test-secret-value-1234";
const USER: AdminUser = {
  id: "usr_test",
  name: "Test User",
  email: "test@worldportal.travel",
  role: "admin",
};

describe("session tokens", () => {
  it("round-trips the signed user", () => {
    const { token } = createSessionToken(USER, SECRET);
    expect(verifySessionToken(token, SECRET)).toMatchObject(USER);
  });

  it("rejects a token signed with a different secret", () => {
    const { token } = createSessionToken(USER, SECRET);
    expect(verifySessionToken(token, "another-secret-value")).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const { token } = createSessionToken(USER, SECRET);
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...USER, role: "admin", exp: 99999999999 }),
    ).toString("base64url");

    expect(verifySessionToken(`${forged}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects an expired token", () => {
    const { token } = createSessionToken(USER, SECRET, -1);
    expect(verifySessionToken(token, SECRET)).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(verifySessionToken(undefined, SECRET)).toBeNull();
    expect(verifySessionToken("not-a-token", SECRET)).toBeNull();
  });
});
