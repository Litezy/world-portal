import type {
  BackendPaymentStatus,
  PassportStatus,
  VisaStatus,
} from "@/server/data/backend-types";

/** Visa and passport files share one set of stages. */
export type CaseStatus = VisaStatus | PassportStatus;

/**
 * Which stage a file may move to by hand, per ADR 0017 §4.3. Evaluated is
 * reached by setting the cost, not from this table. Approved and Rejected are
 * final: both email the applicant, so neither can be quietly walked back.
 *
 * The service will enforce the same table (ADR 0017); until it does, the
 * console's own routes refuse anything outside it.
 */
export const caseTransitions: Record<CaseStatus, readonly CaseStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  EVALUATED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export function nextStatuses(status: CaseStatus): readonly CaseStatus[] {
  return caseTransitions[status] ?? [];
}

export function canMove(from: CaseStatus, to: CaseStatus) {
  return nextStatuses(from).includes(to);
}

/**
 * Whether the cost can still be set (ADR 0016, mirrored by the service).
 * While the applicant has money paid in, the price is fixed; once a decision
 * is made it's closed. A file under review with nothing held can be priced:
 * its review was started before pricing, or its payment was refunded.
 * Without that, Start review on an unpriced file left it with no way to be
 * paid for.
 */
export function canEvaluate(status: CaseStatus, paymentStatus: BackendPaymentStatus) {
  const decided = status === "APPROVED" || status === "REJECTED";
  const moneyHeld =
    paymentStatus === "PARTIALLY_PAID" || paymentStatus === "FULLY_PAID";
  return !decided && !moneyHeld;
}
