import { serverEnv } from "@/config/env";

/**
 * Who may talk to Vivid on E-Embassy. The ONE place that decides it: both the
 * session mint and the server-tool route ask here.
 *
 * Today Vivid is free on E-Embassy for every signed-in WorldStreet applicant
 * (product decision, 2026-09-23) — it is the application assistant.
 *
 * On WorldStreet, Vivid is a paid subscription. To make E-Embassy honour it,
 * set VIVID_REQUIRE_SUBSCRIPTION=true and implement
 * `hasWorldStreetVividSubscription` below. The reference is Xtreme's
 * `lib/vivid/entitlement.ts`: a read-only lookup of the user's row in the hub's
 * `vividentitlements` collection (`status: "active"` within
 * `currentPeriodEnd`, or `"past_due"` within `graceUntil`) over
 * VIVID_MONGODB_URI. Nothing else changes — a refusal here already makes the
 * mint answer 402, and the orb already sends a 402 to WorldStreet's paywall.
 */
export async function hasVividAccess(userId: string): Promise<boolean> {
  if (!userId) return false;
  if (serverEnv().VIVID_REQUIRE_SUBSCRIPTION !== "true") return true;
  return hasWorldStreetVividSubscription(userId);
}

async function hasWorldStreetVividSubscription(userId: string): Promise<boolean> {
  // Fails closed: switching the flag on without the lookup must not quietly
  // hand out a paid feature.
  console.error(
    `[vivid/access] VIVID_REQUIRE_SUBSCRIPTION is on but the WorldStreet subscription check is not implemented — refusing ${userId}`,
  );
  return false;
}
