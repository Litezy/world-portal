import { afterEach, describe, expect, it, vi } from "vitest";

/** Re-import the seed with the clock pinned — it stamps dates at module load. */
async function seedAt(hour: number, minute: number) {
  const at = new Date();
  at.setHours(hour, minute, 0, 0);
  vi.setSystemTime(at);
  vi.resetModules();
  const seed = await import("@/server/data/seed");
  return { seed, now: at.getTime() };
}

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});

describe("seed timestamps", () => {
  // 00:54 is the hour that first caught this: `daysAgo(0, 9)` is still ahead
  // of the clock before 09:00, so records arrived "in 8 hours".
  it.each([
    ["just after midnight", 0, 54],
    ["mid-morning", 10, 30],
    ["late evening", 23, 15],
  ])("never lands in the future — %s", async (_label, hour, minute) => {
    vi.useFakeTimers();
    const { seed, now } = await seedAt(hour, minute);

    const stamps = [
      ...seed.seedEnquiries.flatMap((e) => [e.createdAt, e.updatedAt]),
      ...seed.seedApplications.flatMap((a) => [
        a.submittedAt,
        ...a.timeline.map((t) => t.at),
      ]),
      ...seed.seedCustomers.flatMap((c) => [c.createdAt, c.lastActiveAt]),
    ];

    const future = stamps.filter((s) => Date.parse(s) > now);
    expect(future).toEqual([]);
  });

  it("keeps an enquiry's updatedAt at or after its createdAt", async () => {
    vi.useFakeTimers();
    const { seed } = await seedAt(0, 54);

    for (const enquiry of seed.seedEnquiries) {
      expect(Date.parse(enquiry.updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(enquiry.createdAt),
      );
    }
  });
});
