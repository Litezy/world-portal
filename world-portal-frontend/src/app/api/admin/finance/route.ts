import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import {
  type BackendPaymentConfig,
  type BackendRefund,
  type BackendTransaction,
  toAmount,
} from "@/server/data/backend-types";
import { backendErrorResponse, listParamsFrom, paginate } from "@/server/http";

const DEFAULT_CONFIG: BackendPaymentConfig = {
  id: "cfg-1",
  partnerMarkupPercentage: "10.00",
  serviceFeePercentage: "5.00",
  refundSurchargePercentage: "15.00",
  updatedBy: "system",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const params = listParamsFrom(request);
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "transactions";

  try {
    let transactions: BackendTransaction[] = [];
    let refunds: BackendRefund[] = [];
    let config: BackendPaymentConfig = DEFAULT_CONFIG;

    try {
      const rawTx = await backend<any[]>("/payments/transactions", {
        token: session.token,
      });
      transactions = rawTx.map((t) => ({
        ...t,
        currency: t.currency || t.visaDocumentation?.currency || "NGN",
      }));
    } catch {
      transactions = [];
    }

    try {
      refunds = await backend<BackendRefund[]>("/payments/refunds", {
        token: session.token,
      });
    } catch {
      refunds = [];
    }

    try {
      config = await backend<BackendPaymentConfig>("/payments/config", {
        token: session.token,
      });
    } catch {
      config = DEFAULT_CONFIG;
    }

    const revenueByCurrency: Record<string, number> = {};
    const outstandingByCurrency: Record<string, number> = {};
    const refundVolumeByCurrency: Record<string, number> = {};

    transactions.forEach((t) => {
      const cur = t.currency || "NGN";
      const amt = toAmount(t.amount);

      if (t.status === "CONFIRMED") {
        revenueByCurrency[cur] = (revenueByCurrency[cur] || 0) + amt;
      }
      if (t.paymentOption === "HALF_INSTALLMENT" && t.status === "CONFIRMED") {
        outstandingByCurrency[cur] = (outstandingByCurrency[cur] || 0) + amt;
      }
    });

    refunds.forEach((r) => {
      const cur = r.currency || "NGN";
      const amt = toAmount(r.netRefundAmount);
      refundVolumeByCurrency[cur] = (refundVolumeByCurrency[cur] || 0) + amt;
    });

    const refundCount = refunds.length;
    const effectiveMargin = toAmount(config.serviceFeePercentage) || 5.0;

    const summary = {
      revenueByCurrency,
      outstandingByCurrency,
      refundVolumeByCurrency,
      refundCount,
      effectiveMargin,
    };

    if (tab === "config") {
      return NextResponse.json({ success: true, data: config, summary });
    }

    if (tab === "refunds") {
      const filtered = refunds.filter((r) =>
        params.q
          ? r.refundRef.toLowerCase().includes(params.q.toLowerCase()) ||
            r.reason.toLowerCase().includes(params.q.toLowerCase())
          : true,
      );
      const paginated = paginate(filtered, params.page, params.perPage);
      return NextResponse.json({ ...paginated, summary });
    }

    // Default: transactions tab
    const filtered = transactions.filter((t) =>
      params.q
        ? t.transactionRef.toLowerCase().includes(params.q.toLowerCase()) ||
          (t.paymentMethod && t.paymentMethod.toLowerCase().includes(params.q.toLowerCase()))
        : true,
    );
    const paginated = paginate(filtered, params.page, params.perPage);
    return NextResponse.json({ ...paginated, summary });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
