"use client";

import * as React from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Percent,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import { DataTablePagination, DataTableToolbar, TableEmptyRow, TableSkeletonRows } from "@/components/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { finance as copy } from "@/content/admin";
import { useFinance } from "@/features/finance/api/use-finance";
import { useListParams } from "@/hooks/use-list-params";
import { formatCurrency, formatRelative } from "@/lib/utils";
import {
  type BackendPaymentConfig,
  type BackendRefund,
  type BackendTransaction,
  toAmount,
} from "@/server/data/backend-types";
import type { Paginated } from "@/types";

const COLUMNS = 6;

export function FinanceView() {
  const { params, set } = useListParams();
  const listParams = params as typeof params & { tab?: string };
  const activeTab = listParams.tab || "transactions";

  const { data, isPending, isError, isPlaceholderData } = useFinance<any>({
    ...listParams,
    tab: activeTab,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Financial KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="solid" radius="lg" padding="none" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-muted-foreground">Total Revenue</span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="size-4" />
            </span>
          </div>
          <p className="font-sans mt-3 text-[32px] font-bold tracking-tight text-foreground tabular-nums">
            $54,850.00
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="size-3.5" />
            <span>+18.4% this month</span>
          </div>
        </Card>

        <Card variant="solid" radius="lg" padding="none" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-muted-foreground">Outstanding Balance</span>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="font-sans mt-3 text-[32px] font-bold tracking-tight text-foreground tabular-nums">
            $12,400.00
          </p>
          <p className="mt-3 text-[12px] text-muted-foreground">Pending 50% installment releases</p>
        </Card>

        <Card variant="solid" radius="lg" padding="none" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-muted-foreground">Refund Requests</span>
            <span className="grid size-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600">
              <RefreshCw className="size-4" />
            </span>
          </div>
          <p className="font-sans mt-3 text-[32px] font-bold tracking-tight text-foreground tabular-nums">
            4 Requests
          </p>
          <p className="mt-3 text-[12px] text-muted-foreground">$1,250.00 net refund volume</p>
        </Card>

        <Card variant="solid" radius="lg" padding="none" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-muted-foreground">Effective Margin</span>
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Percent className="size-4" />
            </span>
          </div>
          <p className="font-sans mt-3 text-[32px] font-bold tracking-tight text-foreground tabular-nums">
            12.5%
          </p>
          <p className="mt-3 text-[12px] text-muted-foreground">Average service fee yield</p>
        </Card>
      </div>

      {/* Main Tabs Navigation & Views */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => set({ tab, page: 1 })}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="transactions">{copy.tabs.transactions}</TabsTrigger>
          <TabsTrigger value="refunds">{copy.tabs.refunds}</TabsTrigger>
          <TabsTrigger value="config">{copy.tabs.config}</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="transactions" className="m-0">
            <TransactionsTab
              data={data as Paginated<BackendTransaction> | undefined}
              isPending={isPending}
              isError={isError}
              isPlaceholderData={isPlaceholderData}
              params={params}
              set={set}
            />
          </TabsContent>

          <TabsContent value="refunds" className="m-0">
            <RefundsTab
              data={data as Paginated<BackendRefund> | undefined}
              isPending={isPending}
              isError={isError}
              isPlaceholderData={isPlaceholderData}
              params={params}
              set={set}
            />
          </TabsContent>

          <TabsContent value="config" className="m-0">
            <ConfigTab
              config={(data as { success: boolean; data: BackendPaymentConfig })?.data}
              isPending={isPending}
              isError={isError}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function TransactionsTab({
  data,
  isPending,
  isError,
  isPlaceholderData,
  params,
  set,
}: {
  data?: Paginated<BackendTransaction>;
  isPending: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  params: any;
  set: (p: any) => void;
}) {
  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
      />

      <div data-pending={isPlaceholderData || undefined} className="data-pending:opacity-60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Transaction Ref</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Option</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load transactions</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={CreditCard}
                  title={copy.empty.title}
                  description={copy.empty.body}
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((tx) => (
              <TableRow key={tx.id} data-interactive="true">
                <TableCell className="font-mono font-medium text-foreground">
                  {tx.transactionRef}
                </TableCell>
                <TableCell className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(toAmount(tx.amount))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-medium">
                    {tx.paymentOption === "HALF_INSTALLMENT" ? "50% Installment" : "Full Payment"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {tx.paymentMethod || "CARD"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tx.status === "CONFIRMED"
                        ? "success"
                        : tx.status === "REFUNDED"
                          ? "softWarning"
                          : "muted"
                    }
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                  {formatRelative(tx.createdAt)}
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
          noun="transactions"
        />
      ) : null}
    </Card>
  );
}

function RefundsTab({
  data,
  isPending,
  isError,
  isPlaceholderData,
  params,
  set,
}: {
  data?: Paginated<BackendRefund>;
  isPending: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  params: any;
  set: (p: any) => void;
}) {
  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
      />

      <div data-pending={isPlaceholderData || undefined} className="data-pending:opacity-60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Refund Ref</TableHead>
              <TableHead>Original Amount</TableHead>
              <TableHead>Surcharge (15%)</TableHead>
              <TableHead>Net Refund</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions / Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load refunds</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={RefreshCw}
                  title="No refund requests"
                  description="Refund requests will appear here for review."
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((refund) => (
              <TableRow key={refund.id} data-interactive="true">
                <TableCell className="font-mono font-medium text-foreground">
                  {refund.refundRef}
                  <span className="block text-[11px] font-normal text-muted-foreground truncate max-w-[200px]">
                    {refund.reason}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatCurrency(toAmount(refund.originalAmount))}
                </TableCell>
                <TableCell className="tabular-nums text-destructive">
                  -{formatCurrency(toAmount(refund.surchargeAmount))}
                </TableCell>
                <TableCell className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(toAmount(refund.netRefundAmount))}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      refund.status === "PROCESSED"
                        ? "success"
                        : refund.status === "REJECTED"
                          ? "destructive"
                          : "softWarning"
                    }
                  >
                    {refund.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs whitespace-nowrap">
                  {refund.status === "REQUESTED" ? (
                    <Button size="sm" variant="primary" className="h-8 text-xs">
                      Process Refund
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">
                      {formatRelative(refund.createdAt)}
                    </span>
                  )}
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
          noun="refunds"
        />
      ) : null}
    </Card>
  );
}

function ConfigTab({
  config,
  isPending,
  isError,
}: {
  config?: BackendPaymentConfig;
  isPending: boolean;
  isError: boolean;
}) {
  const [partnerMarkup, setPartnerMarkup] = React.useState("10.00");
  const [serviceFee, setServiceFee] = React.useState("5.00");
  const [refundSurcharge, setRefundSurcharge] = React.useState("15.00");

  React.useEffect(() => {
    if (config) {
      setPartnerMarkup(config.partnerMarkupPercentage);
      setServiceFee(config.serviceFeePercentage);
      setRefundSurcharge(config.refundSurchargePercentage);
    }
  }, [config]);

  if (isPending) {
    return (
      <Card variant="solid" className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>Failed to load configuration</AlertTitle>
        <AlertDescription>Please refresh to reload financial settings.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card variant="solid" radius="lg" className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="size-4 text-primary" />
            Platform Fee Rates
          </CardTitle>
          <CardDescription>
            Configure default markups, service fees, and surcharge calculations across World Portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partnerMarkup">Partner Agency Markup (%)</Label>
            <Input
              id="partnerMarkup"
              type="number"
              step="0.01"
              value={partnerMarkup}
              onChange={(e) => setPartnerMarkup(e.target.value)}
            />
            <p className="text-[11.5px] text-muted-foreground">
              Applied automatically to partner-referred visa processing entries.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceFee">Service Fee Rate (%)</Label>
            <Input
              id="serviceFee"
              type="number"
              step="0.01"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
            />
            <p className="text-[11.5px] text-muted-foreground">
              Platform processing fee percentage on public visa submissions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refundSurcharge">Refund Surcharge Deduction (%)</Label>
            <Input
              id="refundSurcharge"
              type="number"
              step="0.01"
              value={refundSurcharge}
              onChange={(e) => setRefundSurcharge(e.target.value)}
            />
            <p className="text-[11.5px] text-muted-foreground">
              Percentage deducted from original amount when issuing a refund.
            </p>
          </div>

          <Button variant="primary" className="w-full mt-4">
            Save Fee Configuration
          </Button>
        </CardContent>
      </Card>

      <Card variant="solid" radius="lg" className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-primary" />
            Financial Rules Summary
          </CardTitle>
          <CardDescription>
            Active calculation engine rules applied to transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-3 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <span className="font-semibold text-foreground">50% Installment Rule:</span> When
            enabled during cost evaluation, applicants pay 50% upfront and the remaining 50%
            before final document release.
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <span className="font-semibold text-foreground">Refund Calculation Formula:</span>
            <br />
            <code className="font-mono text-[11px] text-foreground mt-1 block">
              Net Refund = Original Amount - (Original Amount × Surcharge %)
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
