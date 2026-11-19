import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import type { AgencyUser } from "@/features/agency/types";
import {
  createAgencySessionToken,
  verifyAgencySessionToken,
} from "@/server/agency/session";
import { createSessionToken, verifySessionToken } from "@/server/auth/session";
import type { AdminUser } from "@/types";

/**
 * Both consoles sign their cookies with the same SESSION_SECRET, so a valid
 * signature alone does not say which console a cookie was minted for. Each
 * payload carries an audience, and each verifier accepts only its own: an
 * agency that pastes its cookie into `wp_admin_session` must not reach the
 * desk, and the reverse.
 */
const SECRET = "test-secret-value-1234";

const ADMIN: AdminUser & { token: string } = {
  id: "usr_test",
  name: "Test User",
  email: "test@worldportal.travel",
  role: "MANAGER",
  token: "backend-access-token",
};

const AGENCY: AgencyUser = {
  id: "agu-1",
  name: "Kemi Owner",
  email: "kemi@agency.test",
  role: "owner",
  agencyId: "ag-1",
  agencyName: "Shield Security",
};

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

/** Signs any payload the way both consoles do — a forger holding the secret's output. */
function signRaw(payload: object, secret = SECRET) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

function claimsOf(token: string) {
  return JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"));
}

describe("admin session audience", () => {
  it("is minted for the admin console", () => {
    const { token } = createSessionToken(ADMIN, SECRET);
    expect(claimsOf(token).aud).toBe("admin");
    expect(verifySessionToken(token, SECRET)).toMatchObject(ADMIN);
  });

  it("refuses an agency session", () => {
    const { token } = createAgencySessionToken(AGENCY, SECRET);
    expect(verifySessionToken(token, SECRET)).toBeNull();
  });

  it("refuses a payload with no audience (a cookie minted before this change)", () => {
    expect(
      verifySessionToken(signRaw({ ...ADMIN, exp: inAnHour() }), SECRET),
    ).toBeNull();
  });

  it("refuses the agency audience even on an admin-shaped payload", () => {
    const token = signRaw({ ...ADMIN, aud: "agency", exp: inAnHour() });
    expect(verifySessionToken(token, SECRET)).toBeNull();
  });

  it("refuses an admin payload without a string access token", () => {
    const { token: _token, ...noToken } = ADMIN;
    expect(
      verifySessionToken(
        signRaw({ ...noToken, aud: "admin", exp: inAnHour() }),
        SECRET,
      ),
    ).toBeNull();
    expect(
      verifySessionToken(
        signRaw({ ...ADMIN, token: 42, aud: "admin", exp: inAnHour() }),
        SECRET,
      ),
    ).toBeNull();
  });

  it("refuses an admin payload whose role the console does not know", () => {
    for (const role of ["owner", "ADMIN", undefined]) {
      const token = signRaw({ ...ADMIN, role, aud: "admin", exp: inAnHour() });
      expect(verifySessionToken(token, SECRET), String(role)).toBeNull();
    }
  });

  it("does not let the caller's fields override the audience", () => {
    const { token } = createSessionToken(
      { ...ADMIN, aud: "agency" } as AdminUser & { token: string },
      SECRET,
    );
    expect(claimsOf(token).aud).toBe("admin");
  });
});

describe("agency session audience", () => {
  it("is minted for the agency console", () => {
    const { token } = createAgencySessionToken(AGENCY, SECRET);
    expect(claimsOf(token).aud).toBe("agency");
    expect(verifyAgencySessionToken(token, SECRET)).toMatchObject(AGENCY);
  });

  it("refuses an admin session", () => {
    const { token } = createSessionToken(ADMIN, SECRET);
    expect(verifyAgencySessionToken(token, SECRET)).toBeNull();
  });

  it("refuses an admin session that also names an agency", () => {
    const token = signRaw({
      ...ADMIN,
      agencyId: "ag-1",
      aud: "admin",
      exp: inAnHour(),
    });
    expect(verifyAgencySessionToken(token, SECRET)).toBeNull();
  });

  it("refuses a payload with no audience (a cookie minted before this change)", () => {
    expect(
      verifyAgencySessionToken(signRaw({ ...AGENCY, exp: inAnHour() }), SECRET),
    ).toBeNull();
  });

  it("still refuses the agency audience without an agency", () => {
    const { agencyId: _agencyId, ...noAgency } = AGENCY;
    expect(
      verifyAgencySessionToken(
        signRaw({ ...noAgency, aud: "agency", exp: inAnHour() }),
        SECRET,
      ),
    ).toBeNull();
  });

  it("does not let the caller's fields override the audience", () => {
    const { token } = createAgencySessionToken(
      { ...AGENCY, aud: "admin" } as AgencyUser,
      SECRET,
    );
    expect(claimsOf(token).aud).toBe("agency");
  });
});
