import { describe, expect, it } from "vitest";

import { toCustomers } from "@/server/data/mappers";
import {
  collectedByCurrency,
  outstandingByCurrency,
  refundsFromTransactions,
  refundVolumeByCurrency,
  transactionCurrency,
} from "@/server/data/money";
import { paginate } from "@/server/http";
import type { PassportApplication, VisaApplication } from "@/types";

const app = (
  currency: string,
  amountPaid: number,
  balanceDue: number,
  id?: string,
) => ({
  id,
  currency,
  amountPaid,
  balanceDue,
});

describe("money figures", () => {
  it("takes a transaction's currency from its application when it has none", () => {
    expect(
      transactionCurrency({ amount: "1", status: "CONFIRMED", currency: "GBP" }),
    ).toBe("GBP");
    expect(
      transactionCurrency({
        amount: "1",
        status: "CONFIRMED",
        visaDocumentation: { currency: "USD" },
      }),
    ).toBe("USD");
    expect(
      transactionCurrency({
        amount: "1",
        status: "CONFIRMED",
        passportApplication: { currency: "NGN" },
      }),
    ).toBe("NGN");
  });

  it("counts only confirmed transactions as collected, kept per currency", () => {
    const totals = collectedByCurrency(
      [
        {
          amount: "100.00",
          status: "CONFIRMED",
          currency: "USD",
          visaDocumentationId: "v1",
        },
        {
          amount: "40.00",
          status: "CONFIRMED",
          currency: "USD",
          visaDocumentationId: "v1",
        },
        { amount: "9000", status: "CONFIRMED", currency: "NGN" },
        {
          amount: "500.00",
          status: "INITIATED",
          currency: "USD",
          visaDocumentationId: "v1",
        },
        {
          amount: "75.00",
          status: "REFUNDED",
          currency: "USD",
          visaDocumentationId: "v1",
        },
      ],
      // On the ledger, so its own amountPaid is not counted again.
      [app("USD", 999, 0, "v1")],
    );

    expect(totals).toEqual({ USD: 140, NGN: 9000 });
  });

  it("falls back to recorded payments when there is no ledger at all", () => {
    expect(
      collectedByCurrency([], [app("USD", 300, 0, "v1"), app("NGN", 0, 10, "v2")]),
    ).toEqual({ USD: 300 });
  });

  it("keeps older payments once the first transaction is recorded", () => {
    // Twenty files paid before the ledger existed, then one bank transfer.
    const older = Array.from({ length: 20 }, (_, i) =>
      app("NGN", 100_000, 0, `old-${i}`),
    );
    const totals = collectedByCurrency(
      [
        {
          amount: "10000",
          status: "CONFIRMED",
          currency: "NGN",
          passportApplicationId: "new-1",
        },
      ],
      [...older, app("USD", 50, 0, "usd-old"), app("NGN", 10_000, 0, "new-1")],
    );

    expect(totals).toEqual({ NGN: 2_010_000, USD: 50 });
  });

  it("treats outstanding as what applicants still owe — not money already received", () => {
    expect(
      outstandingByCurrency([
        app("USD", 250, 250),
        app("USD", 500, 0),
        app("NGN", 0, 80000),
      ]),
    ).toEqual({ USD: 250, NGN: 80000 });
  });

  it("gives each nested refund its transaction's currency and reference", () => {
    const refunds = refundsFromTransactions([
      {
        transactionRef: "BANK-9",
        amount: "100",
        status: "REFUNDED",
        visaDocumentation: { currency: "USD" },
        refunds: [{ refundRef: "RFD-9", netRefundAmount: "85.00" }],
      },
      { transactionRef: "BANK-10", amount: "5", status: "CONFIRMED", refunds: null },
    ]);

    expect(refunds).toEqual([
      expect.objectContaining({
        refundRef: "RFD-9",
        currency: "USD",
        transactionRef: "BANK-9",
      }),
    ]);
    expect(refundVolumeByCurrency(refunds)).toEqual({ USD: 85 });
  });
});

describe("toCustomers", () => {
  const visa = (
    email: string,
    amountPaid: number,
    currency: string,
    createdAt: string,
  ) =>
    ({
      applicant: { email, name: "Ada Okafor", phone: "+234 800 000 0000" },
      nationality: "Nigeria",
      createdAt,
      amountPaid,
      currency,
    }) as unknown as VisaApplication;
  const passport = (
    email: string,
    amountPaid: number,
    currency: string,
    createdAt: string,
  ) =>
    ({
      applicant: { email, name: "Ada Okafor" },
      stateOfOrigin: "Lagos",
      createdAt,
      amountPaid,
      currency,
    }) as unknown as PassportApplication;

  it("keeps what each applicant paid per currency, passports included", () => {
    const [customer] = toCustomers(
      [
        visa("Ada@example.com", 200, "USD", "2026-01-01T00:00:00.000Z"),
        visa("ada@example.com", 50, "USD", "2026-02-01T00:00:00.000Z"),
      ],
      [passport("ada@example.com", 35000, "NGN", "2026-03-01T00:00:00.000Z")],
    );

    expect(customer.applications).toBe(3);
    expect(customer.paidByCurrency).toEqual({ USD: 250, NGN: 35000 });
    expect(customer.lastActiveAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("records nothing paid for an applicant who hasn't paid", () => {
    const [customer] = toCustomers(
      [visa("new@example.com", 0, "USD", "2026-01-01T00:00:00.000Z")],
      [],
    );

    expect(customer.paidByCurrency).toEqual({});
  });
});

describe("paginate", () => {
  it("clamps the page into range and reports the totals", () => {
    const items = Array.from({ length: 23 }, (_, i) => i);

    expect(paginate(items, 3, 10)).toEqual({
      data: [20, 21, 22],
      meta: { page: 3, perPage: 10, total: 23, totalPages: 3 },
    });
    expect(paginate(items, 99, 10).meta.page).toBe(3);
    expect(paginate([], 1, 10).meta).toEqual({
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 1,
    });
  });
});
