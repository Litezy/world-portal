"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Percent,
  RefreshCw,
  Undo2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
  type AdminColumn,
  AdminDataTable,
  ConfirmDialog,
  DataTablePagination,
  DataTableToolbar,
  StatCard,
  TableError,
} from "@/components/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { finance as copy, listControls } from "@/content/admin";
import {
  useFinance,
  useProcessRefund,
  useSaveFeeConfig,
} from "@/features/finance/api/use-finance";
import { useListParams } from "@/hooks/use-list-params";
import {
  cn,
  formatCurrency,
  formatMultiCurrencyInline,
  formatRelative,
} from "@/lib/utils";
import {
  type BackendPaymentConfig,
  type BackendRefund,
  type BackendTransaction,
  toAmount,
} from "@/server/data/backend-types";
import type { AdminRole, Paginated } from "@/types";
import {
  type FeeConfigInput,
  feeConfigSchema,
  type RefundInput,
  refundSchema,
} from "@/validations/admin";

/** Mirrors `summary` from `/api/admin/finance` — every figure is the service's own. */
type FinanceSummary = {
  revenueByCurrency: Record<string, number>;
  outstandingByCurrency: Record<string, number>;
  refundVolumeByCurrency: Record<string, number>;
  refundCount: number;
  serviceFeePercentage: number;
  refundSurchargePercentage: number;
};

type RefundRow = BackendRefund & { transactionRef?: string };
type FinancePayload = { summary?: FinanceSummary };
type ListPayload<T> = Paginated<T> & FinancePayload;
type ConfigPayload = { data: BackendPaymentConfig } & FinancePayload;

const TABS = ["transactions", "refunds", "config"] as const;
type Tab = (typeof TABS)[number];

const transactionTone: Record<
  string,
  "success" | "softWarning" | "destructive" | "muted"
> = {
  CONFIRMED: "success",
  REFUNDED: "softWarning",
  FAILED: "destructive",
};

const refundTone: Record<string, "success" | "softWarning" | "destructive"> = {
  PROCESSED: "success",
  REJECTED: "destructive",
};

function money(value: string | number, currency?: string) {
  return formatCurrency(toAmount(value), currency || "NGN");
}

/** Several currencies are listed side by side, never added together. */
function Amounts({ byCurrency }: { byCurrency?: Record<string, number> }) {
  if (!byCurrency) return <>{copy.unavailable}</>;
  const entries = Object.entries(byCurrency).filter(([, amount]) => amount > 0);
  if (entries.length === 0) return <>{formatCurrency(0, "NGN")}</>;
  return <>{entries.map(([cur, amount]) => formatCurrency(amount, cur)).join(" + ")}</>;
}

async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Copying isn't allowed in this browser.");
  }
}

export function FinanceView({ role }: { role: AdminRole }) {
  const canManage = role === "MANAGER";
  const { params, set } = useListParams();
  // `useListParams` only reads the list keys, so the tab is read here.
  const rawTab = useSearchParams().get("tab");
  const activeTab: Tab = (TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as Tab)
    : "transactions";

  const query = useFinance<unknown>({ ...params, tab: activeTab });
  const payload = query.data as FinancePayload | undefined;
  // Undefined when the request failed: the cards then show "—", never invented figures.
  const summary = payload?.summary;
  const pending = query.isPending;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={copy.cards.revenue}
          icon={DollarSign}
          tone="success"
          value={
            pending ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <Amounts byCurrency={summary?.revenueByCurrency} />
            )
          }
          hint={copy.cards.revenueCaption}
        />
        <StatCard
          label={copy.cards.outstanding}
          icon={Clock}
          tone="warning"
          value={
            pending ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <Amounts byCurrency={summary?.outstandingByCurrency} />
            )
          }
          hint={copy.cards.outstandingCaption}
        />
        <StatCard
          label={copy.cards.refunds}
          icon={RefreshCw}
          tone="info"
          value={
            pending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (summary?.refundCount ?? copy.unavailable)
            )
          }
          hint={
            summary
              ? copy.cards.refundsCaption(
                  formatMultiCurrencyInline(summary.refundVolumeByCurrency),
                )
              : undefined
          }
        />
        <StatCard
          label={copy.cards.serviceFee}
          icon={Percent}
          value={
            pending ? (
              <Skeleton className="h-8 w-16" />
            ) : summary ? (
              `${summary.serviceFeePercentage}%`
            ) : (
              copy.unavailable
            )
          }
          hint={copy.cards.serviceFeeCaption}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(tab) => set({ tab, q: undefined })}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="transactions">{copy.tabs.transactions}</TabsTrigger>
          <TabsTrigger value="refunds">{copy.tabs.refunds}</TabsTrigger>
          <TabsTrigger value="config">{copy.tabs.config}</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Only the active tab is fetched, so only it is rendered. */}
          <TabsContent value="transactions" className="m-0">
            {activeTab === "transactions" ? (
              <TransactionsTab
                query={query}
                data={query.data as ListPayload<BackendTransaction> | undefined}
                canManage={canManage}
                surchargePercentage={summary?.refundSurchargePercentage}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="refunds" className="m-0">
            {activeTab === "refunds" ? (
              <RefundsTab
                query={query}
                data={query.data as ListPayload<RefundRow> | undefined}
                surchargePercentage={summary?.refundSurchargePercentage}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="config" className="m-0">
            {activeTab === "config" ? (
              <ConfigTab
                query={query}
                config={(query.data as ConfigPayload | undefined)?.data}
                canManage={canManage}
              />
            ) : null}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

type FinanceQuery = ReturnType<typeof useFinance<unknown>>;

function TransactionsTab({
  query,
  data,
  canManage,
  surchargePercentage,
}: {
  query: FinanceQuery;
  data?: ListPayload<BackendTransaction>;
  canManage: boolean;
  surchargePercentage?: number;
}) {
  const { params, set } = useListParams();
  const [refunding, setRefunding] = React.useState<BackendTransaction | null>(null);

  const columns: AdminColumn<BackendTransaction>[] = [
    {
      id: "ref",
      header: "Reference",
      primary: true,
      required: true,
      cell: (tx) => (
        <span className="font-mono font-medium text-foreground">
          {tx.transactionRef}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: (tx) => (
        <span className="font-semibold text-foreground tabular-nums">
          {money(tx.amount, tx.currency)}
        </span>
      ),
    },
    {
      id: "option",
      header: "Payment",
      cell: (tx) => (
        <Badge variant="outline" className="text-xs font-medium">
          {copy.paymentOptionLabels[tx.paymentOption] ?? tx.paymentOption}
        </Badge>
      ),
    },
    {
      id: "method",
      header: "Method",
      cell: (tx) => (
        <span className="font-mono text-xs text-muted-foreground">
          {tx.paymentMethod ?? copy.unavailable}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (tx) => (
        <Badge variant={transactionTone[tx.status] ?? "muted"}>
          {copy.transactionStatusLabels[tx.status] ?? tx.status}
        </Badge>
      ),
    },
    {
      id: "date",
      header: "Date",
      align: "right",
      cell: (tx) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatRelative(tx.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
      />

      <AdminDataTable
        columns={columns}
        rows={data?.data}
        getRowId={(tx) => tx.id}
        getRowLabel={(tx) => tx.transactionRef}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isRefetching={query.isRefetching}
        isPlaceholderData={query.isPlaceholderData}
        errorTitle={copy.loadFailed.transactions}
        empty={
          <EmptyState
            icon={CreditCard}
            title={copy.empty.title}
            description={copy.empty.body}
            className="border-0"
          />
        }
        rowActions={(tx) => (
          <>
            <DropdownMenuItem
              onSelect={() =>
                void copyText(tx.transactionRef, listControls.referenceCopied)
              }
            >
              <Copy />
              {listControls.copyReference}
            </DropdownMenuItem>
            {tx.status === "CONFIRMED" ? (
              <DropdownMenuItem
                variant="destructive"
                disabled={!canManage}
                onSelect={() => setRefunding(tx)}
              >
                <Undo2 />
                {canManage ? copy.refund.action : copy.refund.managerOnly}
              </DropdownMenuItem>
            ) : null}
          </>
        )}
      />

      {data ? (
        <DataTablePagination
          meta={data.meta}
          onPage={(page) => set({ page })}
          noun="transactions"
        />
      ) : null}

      {refunding ? (
        <RefundDialog
          key={refunding.id}
          transaction={refunding}
          surchargePercentage={surchargePercentage}
          onClose={() => setRefunding(null)}
        />
      ) : null}
    </Card>
  );
}

/**
 * The consequence first: what the applicant paid, what the refund charge
 * keeps, what they get back. The reason is required because it goes into the
 * applicant's email.
 */
function RefundDialog({
  transaction,
  surchargePercentage,
  onClose,
}: {
  transaction: BackendTransaction;
  surchargePercentage?: number;
  onClose: () => void;
}) {
  const refund = useProcessRefund();
  const form = useForm<RefundInput>({
    resolver: zodResolver(refundSchema),
    defaultValues: { transactionRef: transaction.transactionRef, reason: "" },
    mode: "onChange",
  });
  const { errors, isValid } = form.formState;

  const original = toAmount(transaction.amount);
  const rate = surchargePercentage ?? 0;
  const net = original - original * (rate / 100);
  const netLabel = formatCurrency(net, transaction.currency || "NGN");

  const submit = form.handleSubmit(async (values) => {
    try {
      await refund.mutateAsync(values);
      toast.success(copy.refund.done(netLabel));
      onClose();
    } catch {
      // The error is shown inside the dialog; it stays open so nothing typed is lost.
    }
  });

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => (!open ? onClose() : undefined)}
      title={copy.refund.title(transaction.transactionRef)}
      description={
        surchargePercentage === undefined
          ? copy.unavailable
          : copy.refund.body(
              money(transaction.amount, transaction.currency),
              `${rate}%`,
              netLabel,
            )
      }
      confirmLabel={copy.refund.confirm(netLabel)}
      onConfirm={() => void submit()}
      isPending={refund.isPending}
      confirmDisabled={!isValid || surchargePercentage === undefined}
    >
      <div className="grid gap-3">
        {refund.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {refund.error instanceof Error ? refund.error.message : copy.unavailable}
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-1.5">
          <Label htmlFor="refund-reason">{copy.refund.reasonLabel}</Label>
          <Textarea
            id="refund-reason"
            rows={3}
            autoFocus
            aria-invalid={Boolean(errors.reason)}
            aria-describedby="refund-reason-error"
            {...form.register("reason")}
          />
          {errors.reason ? (
            <p id="refund-reason-error" className="text-[11.5px] text-destructive-text">
              {errors.reason.message}
            </p>
          ) : null}
        </div>
      </div>
    </ConfirmDialog>
  );
}

function RefundsTab({
  query,
  data,
  surchargePercentage,
}: {
  query: FinanceQuery;
  data?: ListPayload<RefundRow>;
  /** From the service's fee configuration; left out of the header when unknown. */
  surchargePercentage?: number;
}) {
  const { params, set } = useListParams();

  const columns: AdminColumn<RefundRow>[] = [
    {
      id: "ref",
      header: "Refund",
      primary: true,
      required: true,
      cell: (r) => (
        <div className="min-w-0">
          <span className="font-mono font-medium text-foreground">{r.refundRef}</span>
          <span className="block max-w-[240px] truncate text-[11px] text-muted-foreground">
            {r.reason}
          </span>
        </div>
      ),
    },
    {
      id: "transaction",
      header: "Transaction",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.transactionRef ?? copy.unavailable}
        </span>
      ),
    },
    {
      id: "original",
      header: "Paid",
      cell: (r) => (
        <span className="text-muted-foreground tabular-nums">
          {money(r.originalAmount, r.currency)}
        </span>
      ),
    },
    {
      id: "surcharge",
      header:
        surchargePercentage === undefined
          ? copy.cards.surcharge
          : `${copy.cards.surcharge} (${surchargePercentage}%)`,
      cell: (r) => (
        <span className="text-destructive-text tabular-nums">
          −{money(r.surchargeAmount, r.currency)}
        </span>
      ),
    },
    {
      id: "net",
      header: "Refunded",
      cell: (r) => (
        <span className="font-semibold text-foreground tabular-nums">
          {money(r.netRefundAmount, r.currency)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={refundTone[r.status] ?? "softWarning"}>
          {copy.refundStatusLabels[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      id: "date",
      header: "Date",
      align: "right",
      cell: (r) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatRelative(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.refundSearchPlaceholder}
      />

      <AdminDataTable
        columns={columns}
        rows={data?.data}
        getRowId={(r) => r.id}
        getRowLabel={(r) => r.refundRef}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isRefetching={query.isRefetching}
        isPlaceholderData={query.isPlaceholderData}
        errorTitle={copy.loadFailed.refunds}
        empty={
          <EmptyState
            icon={RefreshCw}
            title={copy.refundsEmpty.title}
            description={copy.refundsEmpty.body}
            className="border-0"
          />
        }
      />

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
  query,
  config,
  canManage,
}: {
  query: FinanceQuery;
  config?: BackendPaymentConfig;
  canManage: boolean;
}) {
  if (query.isPending) {
    return (
      <Card variant="solid" radius="lg" className="gap-4 p-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </Card>
    );
  }

  if (query.isError || !config) {
    return (
      <TableError
        title={copy.loadFailed.config}
        error={query.error}
        onRetry={() => void query.refetch()}
        isRetrying={query.isRefetching}
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Remounts when the saved settings change, so the form starts from them. */}
      <FeeForm key={config.updatedAt} config={config} canManage={canManage} />

      <Card variant="solid" radius="lg" className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-primary" aria-hidden />
            {copy.fees.rulesTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 text-xs text-muted-foreground">
          <p className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            {copy.fees.instalmentRule}
          </p>
          <p className="rounded-xl border border-border/60 bg-muted/30 p-3.5 font-mono text-[11px] text-foreground">
            {copy.fees.refundRule}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const FEE_FIELDS = [
  {
    name: "partnerMarkupPercentage",
    label: copy.fees.partnerMarkup,
    hint: copy.fees.partnerMarkupHint,
  },
  {
    name: "serviceFeePercentage",
    label: copy.fees.serviceFee,
    hint: copy.fees.serviceFeeHint,
  },
  {
    name: "refundSurchargePercentage",
    label: copy.fees.refundSurcharge,
    hint: copy.fees.refundSurchargeHint,
  },
] as const;

function FeeForm({
  config,
  canManage,
}: {
  config: BackendPaymentConfig;
  canManage: boolean;
}) {
  const save = useSaveFeeConfig();
  const form = useForm<z.input<typeof feeConfigSchema>, unknown, FeeConfigInput>({
    resolver: zodResolver(feeConfigSchema),
    defaultValues: {
      partnerMarkupPercentage: toAmount(config.partnerMarkupPercentage),
      serviceFeePercentage: toAmount(config.serviceFeePercentage),
      refundSurchargePercentage: toAmount(config.refundSurchargePercentage),
    },
  });
  const { errors, isDirty } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      toast.success(copy.fees.saved);
    } catch {
      // Shown in the alert below.
    }
  });

  return (
    <Card variant="solid" radius="lg" className="p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent className="size-4 text-primary" aria-hidden />
          {copy.fees.title}
        </CardTitle>
        <CardDescription>{copy.fees.body}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
          {!canManage ? (
            <Alert>
              <AlertDescription>{copy.fees.managerOnly}</AlertDescription>
            </Alert>
          ) : null}
          {save.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {save.error instanceof Error ? save.error.message : copy.unavailable}
              </AlertDescription>
            </Alert>
          ) : null}

          {FEE_FIELDS.map((field) => {
            const error = errors[field.name]?.message;
            return (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={100}
                  disabled={!canManage}
                  aria-invalid={Boolean(error)}
                  aria-describedby={`${field.name}-hint`}
                  {...form.register(field.name)}
                />
                <p
                  id={`${field.name}-hint`}
                  className={cn(
                    "text-[11.5px]",
                    error ? "text-destructive-text" : "text-muted-foreground",
                  )}
                >
                  {error ?? field.hint}
                </p>
              </div>
            );
          })}

          <p className="text-[11.5px] text-muted-foreground">
            {copy.fees.lastUpdated(config.updatedBy, formatRelative(config.updatedAt))}
          </p>

          {canManage ? (
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={save.isPending}
              disabled={!isDirty}
            >
              {copy.fees.save}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
