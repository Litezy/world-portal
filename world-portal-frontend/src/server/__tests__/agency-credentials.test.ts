import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authenticateAgency,
  registerAgency,
  sendAgencyOtp,
} from "@/server/agency/auth";
import * as store from "@/server/agency/store";

/**
 * The API closes every /agency route to the public. Two credentials open them,
 * and each call site must send the right one:
 *
 * - this server acting for a signed-in agency (or for a signed-out /hire
 *   visitor, or for sign-in itself) sends SERVICE_AUTH_KEY as `x-service-key`;
 * - the admin console sends the desk member's own token, so the API checks
 *   that member's role. Verifying an agency and ruling on its documents take
 *   only the desk token: the service key must never ride along there.
 */

const KEY = "k".repeat(40);
const DESK_TOKEN = "desk-token";
const HASH = "hash-that-must-stay-on-the-server";

type Sent = { path: string; method: string; headers: Headers };
let sent: Sent[];

const agency = {
  id: "ag-1",
  name: "Sample Agency",
  email: "owner@example.com",
  verification: "VERIFIED",
  listingStatus: "LIVE",
  documents: [{ kind: "TAX_CERTIFICATE", status: "UPLOADED" }],
  offerings: [],
  // The API no longer sends this; if it ever did, it must stop at this server.
  users: [{ id: "agu-1", name: "Sample Owner", passwordHash: HASH }],
};

const assignment = {
  id: "as-1",
  reference: "HIRE-1",
  agencyId: "ag-1",
  status: "ASSIGNED",
  assignedStaffIds: ["st-1"],
  startsAt: "2026-12-01T09:00:00.000Z",
};

/** What the API answers on each path; enough for every caller to succeed. */
function answer(path: string, method: string): unknown {
  if (path.endsWith("/otp/send")) return { success: true };
  if (path.endsWith("/otp/verify")) return { verified: true };
  if (/\/agency$/.test(path)) return method === "POST" ? agency : [agency];
  if (path.endsWith("/overview")) return { openAssignments: 1 };
  if (path.endsWith("/assignments")) return [assignment];
  if (path.endsWith("/assign") || path.endsWith("/complete")) return assignment;
  if (path.endsWith("/staff")) return method === "POST" ? { id: "st-2" } : [];
  if (path.endsWith("/payouts")) return [];
  return agency;
}

/** The API path a call went to, without the `/api` base. */
function apiPath(input: URL | RequestInfo) {
  return new URL(String(input)).pathname.replace(/^\/api/, "");
}

function agencyCalls() {
  return sent.filter((call) => call.path.includes("/agency"));
}

beforeEach(() => {
  sent = [];
  vi.stubEnv("SERVICE_AUTH_KEY", KEY);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL | string, init?: RequestInit) => {
      const path = apiPath(input);
      const method = init?.method ?? "GET";
      sent.push({ path, method, headers: new Headers(init?.headers) });
      return new Response(
        JSON.stringify({ success: true, data: answer(path, method) }),
        {
          status: 200,
        },
      );
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function expectServiceKeyOnly(calls: Sent[]) {
  expect(calls.length).toBeGreaterThan(0);
  for (const call of calls) {
    expect(call.headers.get("x-service-key"), `${call.method} ${call.path}`).toBe(KEY);
    expect(call.headers.get("authorization"), `${call.method} ${call.path}`).toBeNull();
  }
}

function expectDeskTokenOnly(calls: Sent[]) {
  expect(calls.length).toBeGreaterThan(0);
  for (const call of calls) {
    expect(call.headers.get("authorization"), `${call.method} ${call.path}`).toBe(
      `Bearer ${DESK_TOKEN}`,
    );
    expect(call.headers.get("x-service-key"), `${call.method} ${call.path}`).toBeNull();
  }
}

describe("agency portal calls send the service key", () => {
  it.each<[string, () => Promise<unknown>]>([
    ["getAgency", () => store.getAgency("ag-1")],
    ["getOverview", () => store.getOverview("ag-1")],
    ["updateListing", () => store.updateListing("ag-1", { summary: "Updated" })],
    [
      "setDocument",
      () =>
        store.setDocument("ag-1", "tax_certificate", {
          fileName: "tax.pdf",
          fileUrl: "https://files.example.com/tax.pdf",
        }),
    ],
    ["submitListing", () => store.submitListing("ag-1")],
    ["listAssignments", () => store.listAssignments("ag-1")],
    ["getAssignment", () => store.getAssignment("ag-1", "as-1")],
    ["assignStaff", () => store.assignStaff("ag-1", "as-1", ["st-1"])],
    ["completeAssignment", () => store.completeAssignment("ag-1", "as-1")],
    ["listStaff", () => store.listStaff("ag-1")],
    [
      "addStaff",
      () =>
        store.addStaff("ag-1", {
          name: "Sample Person",
          role: "Guide",
          category: "tour_guide",
          phone: "+10000000000",
          languages: ["English"],
          experienceYears: 2,
          backgroundChecked: true,
        }),
    ],
    ["listPayouts", () => store.listPayouts("ag-1")],
    ["listAgencies (public /hire listing)", () => store.listAgencies({ perPage: 100 })],
  ])("%s", async (_name, run) => {
    await run();
    expectServiceKeyOnly(agencyCalls());
  });
});

/**
 * The service key opens every agency, so the agency in the path must be the
 * session's. An assignment id comes from the browser; unescaped, `../` in it
 * would walk the call over to another agency's assignment.
 */
describe("a client-supplied id stays inside the signed-in agency's path", () => {
  const walkOut = "../../ag-2/assignments/as-9";

  it.each<[string, () => Promise<unknown>]>([
    ["assignStaff", () => store.assignStaff("ag-1", walkOut, ["st-1"])],
    ["completeAssignment", () => store.completeAssignment("ag-1", walkOut)],
  ])("%s", async (_name, run) => {
    await run();
    const [call] = agencyCalls();
    expect(call.path.startsWith("/agency/ag-1/assignments/")).toBe(true);
    expect(call.path).not.toContain("/ag-2/");
  });
});

describe("agency sign-in and signup send the service key to the agency routes", () => {
  it("looks an agency up before sending a sign-in code", async () => {
    await sendAgencyOtp("owner@example.com", "login");
    expectServiceKeyOnly(agencyCalls());
  });

  it("looks an agency up when it signs in", async () => {
    const { user } = await authenticateAgency("owner@example.com", "123456");
    expect(user?.agencyId).toBe("ag-1");
    expectServiceKeyOnly(agencyCalls());
  });

  it("checks for a duplicate and creates the agency on signup", async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const path = apiPath(input);
      const method = init?.method ?? "GET";
      sent.push({ path, method, headers: new Headers(init?.headers) });
      // No agency holds this email yet, so signup goes on to create one.
      const data =
        /\/agency$/.test(path) && method === "GET" ? [] : answer(path, method);
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    });

    const { user } = await registerAgency({
      agencyName: "Sample Agency",
      contactName: "Sample Owner",
      email: "new-owner@example.com",
      phone: "+10000000000",
      countryCode: "US",
      country: "United States",
      otp: "123456",
    });

    expect(user?.agencyId).toBe("ag-1");
    expect(agencyCalls().map((call) => call.method)).toEqual(["GET", "POST"]);
    expectServiceKeyOnly(agencyCalls());
  });
});

describe("an agency user's password hash never reaches the browser", () => {
  /** The session cookie's payload, which the browser also gets in the response body. */
  const payloadOf = (token: string | null) =>
    Buffer.from(String(token).split(".")[0], "base64url").toString("utf8");

  it("is left out of the signed-in user and the session token", async () => {
    const { user, token } = await authenticateAgency("owner@example.com", "123456");

    expect(user?.agencyId).toBe("ag-1");
    expect(JSON.stringify(user)).not.toContain(HASH);
    expect(payloadOf(token)).not.toContain(HASH);
    expect(payloadOf(token)).not.toContain("passwordHash");
  });

  it("is left out of a new signup's user and session token", async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const path = apiPath(input);
      const method = init?.method ?? "GET";
      const data =
        /\/agency$/.test(path) && method === "GET" ? [] : answer(path, method);
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    });

    const { user, token } = await registerAgency({
      agencyName: "Sample Agency",
      contactName: "Sample Owner",
      email: "new-owner@example.com",
      phone: "+10000000000",
      countryCode: "US",
      country: "United States",
      otp: "123456",
    });

    expect(user?.agencyId).toBe("ag-1");
    expect(JSON.stringify(user)).not.toContain(HASH);
    expect(payloadOf(token)).not.toContain(HASH);
  });
});

describe("admin console calls send the desk token, never the service key", () => {
  it("lists agencies as the desk member", async () => {
    await store.listAgencies({ page: 1 }, { token: DESK_TOKEN });
    expectDeskTokenOnly(agencyCalls());
  });

  it("verifies an agency as the desk member", async () => {
    await store.updateAgencyVerification("ag-1", "verified", { token: DESK_TOKEN });
    expect(agencyCalls().map((call) => `${call.method} ${call.path}`)).toEqual([
      "PATCH /agency/ag-1/verify",
    ]);
    expectDeskTokenOnly(agencyCalls());
  });

  it("rules on a document, and reads the result back, as the desk member", async () => {
    await store.updateAgencyDocumentStatus(
      "ag-1",
      "tax_certificate",
      "approved",
      undefined,
      {
        token: DESK_TOKEN,
      },
    );
    expect(agencyCalls().map((call) => `${call.method} ${call.path}`)).toEqual([
      "PATCH /agency/ag-1/documents/tax_certificate",
      "GET /agency/ag-1",
    ]);
    expectDeskTokenOnly(agencyCalls());
  });
});
