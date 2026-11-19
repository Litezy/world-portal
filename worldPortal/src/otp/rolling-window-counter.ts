/**
 * Counts events per key over a rolling window, in memory (like the OTP code
 * store, so one instance's counts are its own).
 *
 * Each key keeps the times of its events inside the window; older ones are
 * dropped whenever the key is read, and a key with none left is forgotten.
 * Keys nobody reads again are swept once the map grows past `sweepAt`, so a
 * stream of one-off keys can't grow it without bound.
 */
export class RollingWindowCounter {
  private readonly events = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly sweepAt = 10_000,
  ) {}

  /** Events recorded for `key` within the window ending `now`. */
  count(key: string, now = Date.now()): number {
    return this.live(key, now).length;
  }

  record(key: string, now = Date.now()): void {
    const times = this.live(key, now);
    times.push(now);
    this.events.set(key, times);
    if (this.events.size > this.sweepAt) this.sweep(now);
  }

  /** Milliseconds until the oldest event for `key` leaves the window. */
  msUntilNextFree(key: string, now = Date.now()): number {
    const [oldest] = this.live(key, now);
    return oldest === undefined ? 0 : oldest + this.windowMs - now;
  }

  private live(key: string, now: number): number[] {
    const times = this.events.get(key);
    if (!times) return [];
    const kept = times.filter((t) => now - t < this.windowMs);
    if (kept.length) this.events.set(key, kept);
    else this.events.delete(key);
    return kept;
  }

  private sweep(now: number): void {
    for (const key of [...this.events.keys()]) this.live(key, now);
  }
}
