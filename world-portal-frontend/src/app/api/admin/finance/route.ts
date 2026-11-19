import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import {
  type BackendPassportApplication,
  type BackendPaymentConfig,
  type BackendRefund,
  type BackendTransaction,
  type BackendVisaApplication,
  toAmount,
} from "@/server/data/backend-types";
import { toPassportApplication, toVisaApplication } from "@/server/data/mappers";
import {
  collectedByCurrency,
  outstandingByCurrency,
  type RawTransaction,
  refundsFromTransactions,
  refundVolumeByCurrency,
  transactionCurrency,
} from "@/server/data/money";
import { backendErrorResponse, paginate, readListParams } from "@/server/http";

type TransactionRow = BackendTransaction &
  RawTransaction & { refunds?: BackendRefund[] | null };

const TABS = ["transactions", "refunds", "config"] as const;
type Tab = (typeof TABS)[number];

function tabFrom(request: Request): Tab {
  const tab = new URL(request.url).searchParams.get("tab");
  return (TABS as readonly string[]).includes(tab ?? "")
    ? (tab as Tab)
    : "transactions";
}

/**
 * Every tab carries the same `summary`, because the KPI cards sit above the
 * tabs. Every figure here is the service's own. There are no fallbacks: a fee
 * configuration the service did not return used to be replaced with invented
 * defaults, and "outstanding" summed confirmed half-payments — money already
 * received. Failures now surface as the screen's error state.
 */
export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { params, response: invalid } = readListParams(request);
  if (invalid) return invalid;
  const tab = tabFrom(request);
  const token = session.token;

  try {
    const [rawTx, visaRecords, passportRecords, config] = await Promise.all([
      backend<TransactionRow[]>("/payments/transactions", { token }),
      backend<BackendVisaApplication[]>("/visa-documentation", { token }),
      backend<BackendPassportApplication[]>("/passport-application", { token }),
      backend<BackendPaymentConfig>("/payments/config", { token }),
    ]);

    const transactions = rawTx.map((t) => ({ ...t, currency: transactionCurrency(t) }));
    // Refunds are read from their transactions, which are fetched anyway for
    // the summary. (`GET /payments/refunds` pages them on the service too.)
    const refunds = refundsFromTransactions(transactions);
    const applications = [
      ...visaRecords.map(toVisaApplication),
      ...passportRecords.map(toPassportApplication),
    ];

    const summary = {
      revenueByCurrency: collectedByCurrency(transactions, applications),
      outstandingByCurrency: outstandingByCurrency(applications),
      refundVolumeByCurrency: refundVolumeByCurrency(refunds),
      refundCount: refunds.length,
      serviceFeePercentage: toAmount(config.serviceFeePercentage),
      refundSurchargePercentage: toAmount(config.refundSurchargePercentage),
    };

    if (tab === "config") {
      return NextResponse.json({ success: true, data: config, summary });
    }

    const q = params.q?.toLowerCase();

    if (tab === "refunds") {
      const filtered = q
        ? refunds.filter(
            (r) =>
              r.refundRef.toLowerCase().includes(q) ||
              r.reason.toLowerCase().includes(q) ||
              (r.transactionRef ?? "").toLowerCase().includes(q),
          )
        : refunds;
      return NextResponse.json({
        ...paginate(filtered, params.page, params.perPage),
        summary,
      });
    }

    const filtered = q
      ? transactions.filter(
          (t) =>
            t.transactionRef.toLowerCase().includes(q) ||
            (t.paymentMethod ?? "").toLowerCase().includes(q),
        )
      : transactions;
    return NextResponse.json({
      ...paginate(filtered, params.page, params.perPage),
      summary,
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
