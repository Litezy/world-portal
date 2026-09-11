"use client";

import { Banknote, Receipt, Wallet } from "lucide-react";

import { agencyPayouts as copy } from "@/content/agency";
import { useAgencyOverview } from "@/features/agency/api/use-overview";
import { useAgencyPayouts } from "@/features/agency/api/use-payouts";
import { PayoutsTable } from "@/features/agency/components/payouts/payouts-table";
import { SettlementExplainer } from "@/features/agency/components/payouts/settlement-explainer";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { formatCurrency } from "@/lib/utils";

export function PayoutsView() {
  const overviewQuery = useAgencyOverview();
  // The tiles are totals over every run, not over the page being read, so they
  // ask for the collection rather than reusing the table's paged query. 100 is
  // the ceiling `listParamsSchema` allows; an agency with more runs than that
  // needs a summary endpoint rather than a bigger page.
  const allPayouts = useAgencyPayouts({ perPage: 100 });

  const currency = overviewQuery.data?.currency ?? allPayouts.data?.data[0]?.currency;
  const payouts = allPayouts.data?.data ?? [];

  const paid = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((total, payout) => total + payout.net, 0);
  const fees = payouts.reduce((total, payout) => total + payout.platformFee, 0);

  const money = (amount: number) => (currency ? formatCurrency(amount, currency) : "—");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Banknote}
          label={copy.stats.pending}
          value={money(overviewQuery.data?.pendingPayout ?? 0)}
        />
        <StatCard icon={Wallet} label={copy.stats.paid} value={money(paid)} />
        <StatCard icon={Receipt} label={copy.stats.fees} value={money(fees)} />
      </div>

      <SettlementExplainer />

      <PayoutsTable />
    </div>
  );
}
