import { toAmount } from "@/server/data/backend-types";

/**
 * Money figures shared by the dashboard and the finance screen, so the two can
 * never disagree about what was collected or what is still owed.
 *
 * Amounts are always kept per currency. Adding naira to dollars produces a
 * number that means nothing, so nothing here sums across currencies.
 */

const FALLBACK_CURRENCY = "NGN";

type MoneyRecord = {
  id?: string;
  currency?: string | null;
  amountPaid: number;
  balanceDue: number;
};

/** A transaction row as `/payments/transactions` returns it (relations included). */
export type RawTransaction = {
  amount: string | number;
  status: string;
  visaDocumentationId?: string | null;
  passportApplicationId?: string | null;
  currency?: string | null;
  visaDocumentation?: { currency?: string | null } | null;
  passportApplication?: { currency?: string | null } | null;
  refunds?: RawRefund[] | null;
};

export type RawRefund = {
  netRefundAmount: string | number;
  [key: string]: unknown;
};

/** A transaction's own currency, else its application's — the service only sets it there. */
export function transactionCurrency(tx: RawTransaction) {
  return (
    tx.currency ||
    tx.visaDocumentation?.currency ||
    tx.passportApplication?.currency ||
    FALLBACK_CURRENCY
  );
}

function add(totals: Record<string, number>, currency: string, amount: number) {
  if (amount <= 0) return;
  totals[currency] = (totals[currency] ?? 0) + amount;
}

/**
 * Collected = confirmed transactions, plus the `amountPaid` of applications
 * that have no transactions at all: their payments predate the ledger. Real
 * recorded amounts, never an estimate.
 *
 * The fallback is per application. It used to apply only while the whole
 * ledger was empty, so the first transaction ever recorded made every older
 * payment drop out of "collected". An application with any ledger entry is
 * counted from the ledger alone: before ADR 0016, refunds didn't lower its
 * `amountPaid`, so the ledger is the truer of the two.
 */
export function collectedByCurrency(
  transactions: RawTransaction[],
  applications: MoneyRecord[],
) {
  const totals: Record<string, number> = {};
  const onLedger = new Set<string>();
  for (const tx of transactions) {
    const applicationId = tx.visaDocumentationId ?? tx.passportApplicationId;
    if (applicationId) onLedger.add(applicationId);
    if (tx.status === "CONFIRMED")
      add(totals, transactionCurrency(tx), toAmount(tx.amount));
  }
  for (const app of applications) {
    if (app.id && onLedger.has(app.id)) continue;
    add(totals, app.currency || FALLBACK_CURRENCY, app.amountPaid);
  }
  return totals;
}

/** Outstanding = what applicants still owe on evaluated applications. */
export function outstandingByCurrency(applications: MoneyRecord[]) {
  const totals: Record<string, number> = {};
  for (const app of applications) {
    add(totals, app.currency || FALLBACK_CURRENCY, app.balanceDue);
  }
  return totals;
}

/** Refunds live nested on their transaction; give each one that transaction's currency. */
export function refundsFromTransactions<R extends RawRefund>(
  transactions: Array<
    RawTransaction & { transactionRef?: string; refunds?: R[] | null }
  >,
): Array<R & { currency: string; transactionRef?: string }> {
  return transactions.flatMap((tx) =>
    (tx.refunds ?? []).map(
      (refund) =>
        ({
          ...refund,
          currency: transactionCurrency(tx),
          transactionRef: tx.transactionRef,
        }) as R & { currency: string; transactionRef?: string },
    ),
  );
}

export function refundVolumeByCurrency(
  refunds: Array<{ netRefundAmount: string | number; currency?: string | null }>,
) {
  const totals: Record<string, number> = {};
  for (const refund of refunds) {
    add(totals, refund.currency || FALLBACK_CURRENCY, toAmount(refund.netRefundAmount));
  }
  return totals;
}
