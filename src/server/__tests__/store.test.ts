import { describe, expect, it } from "vitest";

import {
  advanceApplication,
  getDashboardStats,
  listApplications,
  listCustomers,
  listEnquiries,
  updateEnquiry,
} from "@/server/data/store";

describe("enquiries", () => {
  it("paginates and reports totals", () => {
    const page = listEnquiries({ page: 1, perPage: 4 });
    expect(page.data).toHaveLength(4);
    expect(page.meta.totalPages).toBe(Math.ceil(page.meta.total / 4));
  });

  it("clamps a page beyond the end back to the last page", () => {
    const page = listEnquiries({ page: 999, perPage: 5 });
    expect(page.meta.page).toBe(page.meta.totalPages);
    expect(page.data.length).toBeGreaterThan(0);
  });

  it("searches across name, email, reference and destination", () => {
    expect(listEnquiries({ q: "liu wei" }).data[0]?.fullName).toBe("Liu Wei");
    expect(listEnquiries({ q: "WPB-M7J9Q" }).data[0]?.reference).toBe("WPB-M7J9Q");
    expect(listEnquiries({ q: "lisbon" }).meta.total).toBeGreaterThan(0);
  });

  it("filters by status", () => {
    const won = listEnquiries({ status: "won" });
    expect(won.data.every((e) => e.status === "won")).toBe(true);
  });

  it("updates status and stamps updatedAt", () => {
    const target = listEnquiries({ perPage: 1 }).data[0]!;
    const before = target.updatedAt;
    const updated = updateEnquiry(target.id, { status: "won" });

    expect(updated?.status).toBe("won");
    expect(Date.parse(updated!.updatedAt)).toBeGreaterThanOrEqual(Date.parse(before));
  });

  it("returns null for an unknown id", () => {
    expect(updateEnquiry("nope", { status: "won" })).toBeNull();
  });
});

describe("applications", () => {
  it("derives overdue from the server clock, never the client", () => {
    const all = listApplications({ perPage: 100 }).data;
    expect(
      all.every((a) =>
        ["approved", "rejected"].includes(a.status)
          ? a.overdue === false
          : a.overdue === Date.parse(a.dueAt) < Date.now(),
      ),
    ).toBe(true);
  });

  it("appends a timeline entry when advanced", () => {
    const target = listApplications({ perPage: 1 }).data[0]!;
    const updated = advanceApplication(target.id, "approved", "Decision received.");

    expect(updated?.status).toBe("approved");
    expect(updated?.timeline.at(-1)).toMatchObject({
      status: "approved",
      note: "Decision received.",
    });
    expect(updated?.overdue).toBe(false);
  });
});

describe("customers", () => {
  it("searches by country", () => {
    const results = listCustomers({ q: "ghana" });
    expect(results.data.every((c) => c.country === "Ghana")).toBe(true);
  });
});

describe("dashboard stats", () => {
  it("counts seven days of activity and a full pipeline", () => {
    const stats = getDashboardStats();
    expect(stats.weekly).toHaveLength(7);
    expect(stats.pipeline).toHaveLength(7);
    expect(stats.enquiriesByService.map((s) => s.service)).toEqual([
      "visa",
      "booking",
      "experience",
    ]);
    expect(stats.enquiries.open).toBeLessThanOrEqual(stats.enquiries.total);
  });
});
