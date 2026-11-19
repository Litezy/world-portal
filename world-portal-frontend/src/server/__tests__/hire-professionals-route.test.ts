import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/hire/professionals` is the one agency read a signed-out visitor can
 * reach: the /hire page lists verified agencies. The API's agency list is
 * closed to the public, so this server asks for it with its service key and
 * hands the browser listing fields only. The API's rows carry the agency's
 * contact details, paperwork, staff and commission; none of that may leak.
 */

const KEY = "k".repeat(40);

const verifiedAgency = {
  id: "ag-1",
  slug: "sample-guards",
  name: "Sample Guards",
  legalName: "Sample Guards Holdings Ltd",
  registrationNumber: "REG-000-SAMPLE",
  email: "owner@example.com",
  phone: "+10000000001",
  country: "Portugal",
  countryCode: "PT",
  cities: ["Lisbon"],
  categories: ["security"],
  summary: "Event security in Lisbon.",
  about: "A sample agency used only in tests.",
  logoUrl: null,
  languages: ["English"],
  yearFounded: 2018,
  verification: "VERIFIED",
  listingStatus: "LIVE",
  commissionRate: 0.15,
  payoutAccount: { accountNumber: "0000111122" },
  documents: [
    {
      kind: "BUSINESS_REGISTRATION",
      status: "APPROVED",
      fileUrl: "https://files.example.com/reg.pdf",
    },
  ],
  staff: [{ id: "st-1", name: "Sample Guard", phone: "+10000000002" }],
  users: [{ id: "agu-1", email: "manager@example.com" }],
  offerings: [
    {
      title: "Day cover",
      description: "Eight hours",
      price: 100,
      currency: "USD",
      unit: "day",
    },
  ],
};

let sent: { url: string; headers: Headers }[];

beforeEach(() => {
  sent = [];
  vi.stubEnv("SERVICE_AUTH_KEY", KEY);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL | string, init?: RequestInit) => {
      sent.push({ url: String(input), headers: new Headers(init?.headers) });
      return new Response(
        JSON.stringify({ success: true, data: { data: [verifiedAgency], meta: {} } }),
        { status: 200 },
      );
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/api/hire/professionals", () => {
  it("asks the API with the service key, never a desk token", async () => {
    const route = await import("@/app/api/hire/professionals/route");

    await route.GET(new Request("http://localhost:3000/api/hire/professionals"));

    expect(sent).toHaveLength(1);
    expect(new URL(sent[0].url).pathname).toMatch(/\/agency$/);
    expect(sent[0].headers.get("x-service-key")).toBe(KEY);
    expect(sent[0].headers.get("authorization")).toBeNull();
  });

  it("returns listing fields only", async () => {
    const route = await import("@/app/api/hire/professionals/route");

    const response = await route.GET(
      new Request("http://localhost:3000/api/hire/professionals"),
    );
    const body = (await response.json()) as { id: string; name: string }[];

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ id: "agency-ag-1", name: "Sample Guards" });
    const text = JSON.stringify(body);
    for (const secret of [
      "owner@example.com",
      "manager@example.com",
      "+10000000001",
      "+10000000002",
      "Sample Guards Holdings",
      "REG-000-SAMPLE",
      "reg.pdf",
      "0000111122",
      "commissionRate",
      'Sample Guard"',
    ]) {
      expect(text).not.toContain(secret);
    }
  });
});
