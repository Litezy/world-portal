import { describe, expect, it } from "vitest";

import {
  homeFor,
  isNavItemActive,
  navGroupsFor,
  navItemFor,
} from "@/config/admin-navigation";
import { toCsv } from "@/lib/csv";
import { byDate, byNumber, byText, listResponse } from "@/server/data/list";
import { listParamsSchema } from "@/validations/admin";

type Row = { id: string; name: string; status: string; amount: number; at: string };

const rows: Row[] = [
  {
    id: "a",
    name: "Chidi",
    status: "SUBMITTED",
    amount: 30,
    at: "2026-11-01T09:00:00.000Z",
  },
  {
    id: "b",
    name: "ada",
    status: "APPROVED",
    amount: 10,
    at: "2026-11-03T23:59:00.000Z",
  },
  {
    id: "c",
    name: "Bisi",
    status: "SUBMITTED",
    amount: 20,
    at: "2026-11-05T08:00:00.000Z",
  },
];

const spec = {
  statusOf: (r: Row) => r.status,
  dateOf: (r: Row) => r.at,
  sorters: {
    name: byText((r: Row) => r.name),
    amount: byNumber((r: Row) => r.amount),
    at: byDate((r: Row) => r.at),
  },
  defaultSort: { key: "at", dir: "desc" as const },
  csv: {
    filename: "rows",
    columns: [
      { header: "Name", value: (r: Row) => r.name },
      { header: "Amount", value: (r: Row) => r.amount },
    ],
  },
};

const query = (overrides: Record<string, unknown> = {}) =>
  listParamsSchema.parse({ page: 1, perPage: 10, ...overrides });

async function json(response: Response) {
  return (await response.json()) as {
    data: Row[];
    meta: { counts: Record<string, number>; total: number };
  };
}

describe("list engine", () => {
  it("sorts newest first by default", async () => {
    const body = await json(listResponse(rows, query(), spec));
    expect(body.data.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts by an allowed key, case-insensitively, in either direction", async () => {
    expect(
      (await json(listResponse(rows, query({ sort: "name" }), spec))).data.map(
        (r) => r.id,
      ),
    ).toEqual(["b", "c", "a"]);
    expect(
      (
        await json(listResponse(rows, query({ sort: "amount", dir: "desc" }), spec))
      ).data.map((r) => r.id),
    ).toEqual(["a", "c", "b"]);
  });

  it("ignores a sort key the list does not allow", async () => {
    const body = await json(listResponse(rows, query({ sort: "secret" }), spec));
    expect(body.data.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it.each(["valueOf", "hasOwnProperty", "isPrototypeOf", "toString"])(
    "ignores ?sort=%s instead of calling an Object.prototype method",
    async (sort) => {
      const body = await json(listResponse(rows, query({ sort }), spec));
      expect(body.data.map((r) => r.id)).toEqual(["c", "b", "a"]);
    },
  );

  it("counts every status before the status filter, so each tab shows its true count", async () => {
    const body = await json(listResponse(rows, query({ status: "APPROVED" }), spec));
    expect(body.data.map((r) => r.id)).toEqual(["b"]);
    expect(body.meta.counts).toEqual({ SUBMITTED: 2, APPROVED: 1 });
  });

  it("treats the date range as whole days, inclusive at both ends", async () => {
    const body = await json(
      listResponse(rows, query({ from: "2026-11-02", to: "2026-11-03" }), spec),
    );
    expect(body.data.map((r) => r.id)).toEqual(["b"]);
    expect(body.meta.counts).toEqual({ APPROVED: 1 });
  });

  it("exports every filtered row as CSV, not just one page", async () => {
    const response = listResponse(
      rows,
      query({ perPage: 1, status: "SUBMITTED", format: "csv" }),
      spec,
    );
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /attachment; filename="rows-\d{4}-\d{2}-\d{2}\.csv"/,
    );
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    // A UTF-8 BOM first, so Excel reads accented names; text() strips it.
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await response.text()).toBe("Name,Amount\r\nBisi,20\r\nChidi,30\r\n");
  });

  it("rejects a backwards date range and a malformed date", () => {
    expect(
      listParamsSchema.safeParse({ from: "2026-11-05", to: "2026-11-01" }).success,
    ).toBe(false);
    expect(listParamsSchema.safeParse({ from: "05/11/2026" }).success).toBe(false);
  });
});

describe("toCsv", () => {
  it("quotes commas, quotes and line breaks", () => {
    const csv = toCsv(
      [{ v: 'Okafor, "Ada"\nLagos' }],
      [{ header: "v", value: (r) => r.v }],
    );
    expect(csv).toBe('v\r\n"Okafor, ""Ada""\nLagos"\r\n');
  });

  it("defuses cells a spreadsheet would run as a formula", () => {
    const csv = toCsv(
      [{ v: '=HYPERLINK("x")' }, { v: "+1" }, { v: "-2" }, { v: "@SUM(A1)" }],
      [{ header: "v", value: (r) => r.v }],
    );
    expect(csv.split("\r\n").slice(1, 5)).toEqual([
      `"'=HYPERLINK(""x"")"`,
      "'+1",
      "'-2",
      "'@SUM(A1)",
    ]);
  });

  it("writes empty cells for missing values", () => {
    expect(toCsv([{ v: null }], [{ header: "v", value: (r) => r.v }])).toBe(
      "v\r\n\r\n",
    );
  });
});

describe("console navigation", () => {
  it("shows partners only the pages the service will serve them", () => {
    const hrefs = navGroupsFor("PARTNER").flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toEqual([
      "/admin/applications",
      "/admin/passports",
      "/admin/customers",
      "/admin/settings",
    ]);
  });

  it("shows desk staff everything, in labelled groups", () => {
    const groups = navGroupsFor("MANAGER");
    expect(groups.map((g) => g.label)).toEqual([
      undefined,
      "Applications",
      "Money",
      "Partners",
      "Workspace",
    ]);
  });

  it("matches nested routes to their page but never a lookalike prefix", () => {
    expect(navItemFor("/admin/applications/abc")?.href).toBe("/admin/applications");
    expect(navItemFor("/admin")?.href).toBe("/admin");
    expect(isNavItemActive({ href: "/admin/finance" }, "/admin/financeX")).toBe(false);
  });

  it("sends each role to a page it can use", () => {
    expect(homeFor("MANAGER")).toBe("/admin");
    expect(homeFor("PARTNER")).toBe("/admin/applications");
  });
});
