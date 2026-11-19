/**
 * Failed admin sign-ins, limited in memory: five per visitor address and five
 * per email in a 15-minute window, then 429 until the window that started with
 * the first failure runs out.
 *
 * Both counts matter. The console password is shared, so a guesser can pair
 * each guess with a different email: the per-address count stops that. And an
 * address is cheap to change, so the per-email count stops one account being
 * guessed at from many. A successful sign-in clears its email's count.
 *
 * Every attempt is counted when it starts, not when it fails, and handed back
 * if it succeeds or the service is down. Counting at the end would let a burst
 * of parallel guesses all pass the check before the first one was recorded.
 *
 * In memory means per server instance and gone on restart: a deployment with
 * several instances allows five per instance. That is a stop-gap in the same
 * spirit as the shared password; the API's own rate limits stay the backstop.
 */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
/** Bounds the memory one flood of new addresses or emails can take. */
const MAX_TRACKED = 10_000;

/**
 * When the visitor's address can't be read (no trusted header, see
 * `visitorIpHeaders()`), every such attempt shares this one count. That only
 * happens on a misconfigured deployment or in local development, and sharing
 * fails closed: skipping the address limit would leave guessing unlimited.
 */
const UNKNOWN_ADDRESS = "unknown";

type Bucket = { failures: number; resetAt: number };

class FailureCounts {
  private readonly buckets = new Map<string, Bucket>();

  /** Milliseconds until `key` may try again; 0 when it may try now. */
  blockedFor(key: string, now: number): number {
    const bucket = this.live(key, now);
    return bucket && bucket.failures >= MAX_FAILURES ? bucket.resetAt - now : 0;
  }

  add(key: string, now: number) {
    const bucket = this.live(key, now);
    if (bucket) {
      bucket.failures += 1;
      return;
    }
    this.makeRoom(now);
    this.buckets.set(key, { failures: 1, resetAt: now + WINDOW_MS });
  }

  /** Hands back one attempt that turned out not to be a failure. */
  remove(key: string, now: number) {
    const bucket = this.live(key, now);
    if (!bucket) return;
    bucket.failures -= 1;
    if (bucket.failures <= 0) this.buckets.delete(key);
  }

  clear(key: string) {
    this.buckets.delete(key);
  }

  reset() {
    this.buckets.clear();
  }

  private live(key: string, now: number): Bucket | undefined {
    const bucket = this.buckets.get(key);
    if (bucket && bucket.resetAt <= now) {
      this.buckets.delete(key);
      return undefined;
    }
    return bucket;
  }

  private makeRoom(now: number) {
    if (this.buckets.size < MAX_TRACKED) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    // Still full of live windows: drop the oldest (Maps iterate in insertion order).
    for (const key of this.buckets.keys()) {
      if (this.buckets.size < MAX_TRACKED) break;
      this.buckets.delete(key);
    }
  }
}

const byAddress = new FailureCounts();
const byEmail = new FailureCounts();

export type SignInAttempt = {
  /** The visitor's address from `visitorIpHeaders()`, when it could be read. */
  ip?: string;
  /** Already normalised (trimmed, lower-cased) by the login schema. */
  email: string;
};

const addressOf = (attempt: SignInAttempt) => attempt.ip || UNKNOWN_ADDRESS;

/**
 * Starts an attempt. Returns how many seconds to wait when the address or the
 * email is over the limit (and counts nothing); otherwise counts the attempt
 * as a failure until `signInSucceeded` or `signInNotJudged` says otherwise.
 */
export function beginSignIn(
  attempt: SignInAttempt,
  now = Date.now(),
): { retryAfterSeconds: number } | null {
  const waitMs = Math.max(
    byAddress.blockedFor(addressOf(attempt), now),
    byEmail.blockedFor(attempt.email, now),
  );
  if (waitMs > 0) {
    return { retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
  }
  byAddress.add(addressOf(attempt), now);
  byEmail.add(attempt.email, now);
  return null;
}

/** The credentials were right: clear the email, and hand the address its attempt back. */
export function signInSucceeded(attempt: SignInAttempt, now = Date.now()) {
  byEmail.clear(attempt.email);
  byAddress.remove(addressOf(attempt), now);
}

/** The service couldn't answer, so nothing was judged: hand the attempt back. */
export function signInNotJudged(attempt: SignInAttempt, now = Date.now()) {
  byEmail.remove(attempt.email, now);
  byAddress.remove(addressOf(attempt), now);
}

/** Tests only: forget every count. */
export function resetLoginThrottle() {
  byAddress.reset();
  byEmail.reset();
}
