"use client";

import { Banknote } from "lucide-react";

import {
  DataTablePagination,
  DataTableToolbar,
  TableEmptyRow,
  TableSkeletonRows,
} from "@/components/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agencyPayouts as copy, payoutStatusLabels } from "@/content/agency";
import { useAgencyPayouts } from "@/features/agency/api/use-payouts";
import { PayoutStatusBadge } from "@/features/agency/components/agency-badges";
import type { PayoutStatus } from "@/features/agency/types";
import { useListParams } from "@/hooks/use-list-params";
import { formatCurrency, formatDate } from "@/lib/utils";

const COLUMNS = 8;

const STATUSES = Object.keys(payoutStatusLabels) as PayoutStatus[];

export function PayoutsTable() {
  const { params, set } = useListParams();
  const { data, isPending, isError, isPlaceholderData } = useAgencyPayouts(params);

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
        filter={{
          value: params.status,
          onChange: (status) => set({ status }),
          label: "All statuses",
          options: STATUSES.map((value) => ({
            value,
            label: payoutStatusLabels[value],
          })),
        }}
      />

      <div
        data-pending={isPlaceholderData || undefined}
        className="overflow-x-auto data-pending:opacity-60"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{copy.columns.reference}</TableHead>
              <TableHead>{copy.columns.period}</TableHead>
              <TableHead className="text-right">{copy.columns.jobs}</TableHead>
              <TableHead className="text-right">{copy.columns.gross}</TableHead>
              <TableHead className="text-right">{copy.columns.fee}</TableHead>
              <TableHead className="text-right">{copy.columns.net}</TableHead>
              <TableHead>{copy.columns.status}</TableHead>
              <TableHead>{copy.columns.account}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load your payouts</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={Banknote}
                  title={copy.empty.title}
                  description={copy.empty.body}
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell className="font-mono text-[12.5px] font-medium">
                  {payout.reference}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(payout.periodStart, { day: "numeric", month: "short" })}
                  {" – "}
                  {formatDate(payout.periodEnd, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {payout.assignmentIds.length}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(payout.gross, payout.currency)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  −{formatCurrency(payout.platformFee, payout.currency)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(payout.net, payout.currency)}
                </TableCell>
                <TableCell>
                  <PayoutStatusBadge status={payout.status} />
                  {payout.paidAt ? (
                    <span className="mt-1 block text-[11.5px] whitespace-nowrap text-muted-foreground">
                      {formatDate(payout.paidAt, { day: "numeric", month: "short" })}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {payout.destinationAccount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data ? (
        <DataTablePagination
          meta={data.meta}
          onPage={(page) => set({ page })}
          noun="payouts"
        />
      ) : null}
    </Card>
  );
}
