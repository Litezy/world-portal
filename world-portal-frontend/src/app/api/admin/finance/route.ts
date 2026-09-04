import { NextResponse } from "next/server";

import { backend } from "@/server/api/backend";
import { requireSession } from "@/server/auth";
import type { BackendPaymentConfig, BackendRefund, BackendTransaction } from "@/server/data/backend-types";
import { backendErrorResponse, listParamsFrom, paginate } from "@/server/http";

const SEEDED_TRANSACTIONS: BackendTransaction[] = [
  {
    id: "tx-1",
    transactionRef: "WPV-TX-2026-001",
    visaDocumentationId: "doc-1",
    profileId: "prof-1",
    amount: "45000",
    paymentOption: "FULL",
    paymentMethod: "CARD",
    status: "CONFIRMED",
    confirmedAt: new Date().toISOString(),
    refundedAt: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "tx-2",
    transactionRef: "WPV-TX-2026-002",
    visaDocumentationId: "doc-2",
    profileId: "prof-2",
    amount: "25000",
    paymentOption: "HALF_INSTALLMENT",
    paymentMethod: "BANK_TRANSFER",
    status: "CONFIRMED",
    confirmedAt: new Date().toISOString(),
    refundedAt: null,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "tx-3",
    transactionRef: "WPV-TX-2026-003",
    visaDocumentationId: "doc-3",
    profileId: "prof-3",
    amount: "85000",
    paymentOption: "FULL",
    paymentMethod: "CARD",
    status: "CONFIRMED",
    confirmedAt: new Date().toISOString(),
    refundedAt: null,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "tx-4",
    transactionRef: "WPV-TX-2026-004",
    visaDocumentationId: "doc-4",
    profileId: "prof-4",
    amount: "15000",
    paymentOption: "HALF_INSTALLMENT",
    paymentMethod: "CARD",
    status: "REFUNDED",
    confirmedAt: new Date().toISOString(),
    refundedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

const SEEDED_REFUNDS: BackendRefund[] = [
  {
    id: "rf-1",
    refundRef: "WPV-RF-2026-001",
    transactionId: "tx-4",
    originalAmount: "15000",
    surchargeAmount: "2250",
    netRefundAmount: "12750",
    reason: "Applicant travel schedule cancelled prior to document submission",
    status: "REQUESTED",
    processedBy: null,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "rf-2",
    refundRef: "WPV-RF-2026-002",
    transactionId: "tx-5",
    originalAmount: "30000",
    surchargeAmount: "4500",
    netRefundAmount: "25500",
    reason: "Duplicate payment submission error",
    status: "PROCESSED",
    processedBy: "mgr-1",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

const DEFAULT_CONFIG: BackendPaymentConfig = {
  id: "cfg-1",
  partnerMarkupPercentage: "10.00",
  serviceFeePercentage: "5.00",
  refundSurchargePercentage: "15.00",
  updatedBy: "mgr-1",
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
    if (tab === "config") {
      try {
        const config = await backend<BackendPaymentConfig>("/payments/config", {
          token: session.token,
        });
        return NextResponse.json({ success: true, data: config });
      } catch {
        return NextResponse.json({ success: true, data: DEFAULT_CONFIG });
      }
    }

    if (tab === "refunds") {
      try {
        const refunds = await backend<BackendRefund[]>("/payments/refunds", {
          token: session.token,
          query: { search: params.q },
        });
        return NextResponse.json(paginate(refunds, params.page, params.perPage));
      } catch {
        const filtered = SEEDED_REFUNDS.filter((r) =>
          params.q
            ? r.refundRef.toLowerCase().includes(params.q.toLowerCase()) ||
              r.reason.toLowerCase().includes(params.q.toLowerCase())
            : true,
        );
        return NextResponse.json(paginate(filtered, params.page, params.perPage));
      }
    }

    // Default: transactions tab
    try {
      const transactions = await backend<BackendTransaction[]>("/payments/transactions", {
        token: session.token,
        query: { search: params.q },
      });
      return NextResponse.json(paginate(transactions, params.page, params.perPage));
    } catch {
      const filtered = SEEDED_TRANSACTIONS.filter((t) =>
        params.q
          ? t.transactionRef.toLowerCase().includes(params.q.toLowerCase()) ||
            (t.paymentMethod && t.paymentMethod.toLowerCase().includes(params.q.toLowerCase()))
          : true,
      );
      return NextResponse.json(paginate(filtered, params.page, params.perPage));
    }
  } catch (error) {
    return backendErrorResponse(error);
  }
}
