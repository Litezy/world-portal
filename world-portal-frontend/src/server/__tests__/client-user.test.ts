import { describe, expect, it } from "vitest";

import { toClientAgencyUser } from "@/server/agency/client-user";
import type { AgencySessionPayload } from "@/server/agency/session";
import { toClientUser } from "@/server/auth/client-user";
import type { SessionPayload } from "@/server/auth/session";
import type { ClientAdminUser } from "@/types";

/**
 * The console session cookie carries the World Portal access token. Anything
 * handed to a client component is serialized into the page, so session data
 * reaches components only through these allowlists.
 */
const API_TOKEN = "backend-access-token-must-stay-on-the-server";

const SESSION: SessionPayload = {
  id: "usr_1",
  name: "Ada Desk",
  email: "ada@example.com",
  role: "STAFF",
  exp: 9_999_999_999,
  token: API_TOKEN,
};

describe("toClientUser", () => {
  it("keeps only what the console UI shows", () => {
    expect(toClientUser(SESSION)).toEqual({
      id: "usr_1",
      name: "Ada Desk",
      email: "ada@example.com",
      role: "STAFF",
    });
  });

  it("carries the avatar when the session has one", () => {
    expect(toClientUser({ ...SESSION, avatar: "/a.png" }).avatar).toBe("/a.png");
  });

  it("never carries the access token or the expiry, even once serialized", () => {
    const user = toClientUser(SESSION);

    expect(user).not.toHaveProperty("token");
    expect(user).not.toHaveProperty("exp");
    expect(JSON.stringify(user)).not.toContain(API_TOKEN);
  });

  it("drops fields it does not know, so a secret added to the session stays put", () => {
    const user = toClientUser({ ...SESSION, refreshToken: "r" } as SessionPayload);

    expect(Object.keys(user).sort()).toEqual(["email", "id", "name", "role"]);
  });

  it("makes handing a client component the raw session a type error", () => {
    // @ts-expect-error The session carries `token`, which ClientAdminUser forbids.
    const leaked: ClientAdminUser = SESSION;
    expect(leaked).toBe(SESSION);
  });
});

describe("toClientAgencyUser", () => {
  const AGENCY: AgencySessionPayload = {
    id: "agu_1",
    name: "Kemi Owner",
    email: "kemi@example.com",
    role: "owner",
    agencyId: "agc_1",
    agencyName: "Shield Security",
    exp: 9_999_999_999,
  };

  it("keeps the person and the agency, and drops the cookie's expiry", () => {
    expect(toClientAgencyUser(AGENCY)).toEqual({
      id: "agu_1",
      name: "Kemi Owner",
      email: "kemi@example.com",
      role: "owner",
      agencyId: "agc_1",
      agencyName: "Shield Security",
    });
  });

  it("drops a token if the agency session ever gains one", () => {
    const user = toClientAgencyUser({
      ...AGENCY,
      token: API_TOKEN,
    } as AgencySessionPayload);

    expect(JSON.stringify(user)).not.toContain(API_TOKEN);
  });
});
