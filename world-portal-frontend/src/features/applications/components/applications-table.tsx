"use client";

import * as React from "react";
import Link from "next/link";

import { Copy, Download, ExternalLink, Eye, FileCheck2 } from "lucide-react";
import { toast } from "sonner";

import {
  type AdminColumn,
  AdminDataTable,
  ColumnPicker,
  DataTablePagination,
  DataTableToolbar,
  DateRangeFilter,
  DetailItem,
  DetailList,
  ExportCsvButton,
  PaymentStatusBadge,
  QuickViewSheet,
  StatusTabs,
  useHiddenColumns,
  VisaStatusBadge,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  applications as copy,
  listControls,
  visaCategoryLabels,
  visaStatusLabels,
} from "@/content/admin";
import { useApplications } from "@/features/applications/api/use-applications";
import { useListParams } from "@/hooks/use-list-params";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatCurrency, formatDate, formatRelative } from "@/lib/utils";
import { visaStatusValues } from "@/server/data/backend-types";
import type { VisaApplication } from "@/types";

const detailHref = (v: VisaApplication) => `/admin/applications/${v.id}`;

const columns: AdminColumn<VisaApplication>[] = [
  {
    id: "applicant",
    header: "Applicant",
    sortKey: "applicant",
    primary: true,
    required: true,
    className: "font-medium",
    cell: (v) => (
      <>
        {v.applicant.name}
        <span className="block font-mono text-[11.5px] font-normal text-muted-foreground">
          {v.reference}
        </span>
      </>
    ),
  },
  {
    id: "destination",
    header: "Destination",
    sortKey: "destination",
    cell: (v) => v.destination,
  },
  {
    id: "category",
    header: "Category",
    className: "text-muted-foreground",
    cell: (v) => visaCategoryLabels[v.category],
  },
  {
    id: "stage",
    header: "Stage",
    sortKey: "status",
    cell: (v) => <VisaStatusBadge status={v.status} />,
  },
  {
    id: "payment",
    header: "Payment",
    sortKey: "balance",
    sortFirst: "desc",
    cell: (v) => (
      <>
        <PaymentStatusBadge status={v.paymentStatus} />
        {v.totalAmount > 0 ? (
          <span className="mt-1 block text-[11.5px] text-muted-foreground tabular-nums">
            {formatCurrency(v.amountPaid, v.currency)} of{" "}
            {formatCurrency(v.totalAmount, v.currency)}
          </span>
        ) : null}
      </>
    ),
  },
  {
    id: "submitted",
    header: "Submitted",
    sortKey: "submitted",
    sortFirst: "desc",
    align: "right",
    className: "text-[12.5px] whitespace-nowrap text-muted-foreground",
    cell: (v) => formatRelative(v.createdAt),
  },
];

const selectedCsv = [
  { header: "Reference", value: (v: VisaApplication) => v.reference },
  { header: "Applicant", value: (v: VisaApplication) => v.applicant.name },
  { header: "Email", value: (v: VisaApplication) => v.applicant.email },
  { header: "Destination", value: (v: VisaApplication) => v.destination },
  { header: "Stage", value: (v: VisaApplication) => v.status },
  { header: "Payment", value: (v: VisaApplication) => v.paymentStatus },
  { header: "Balance", value: (v: VisaApplication) => v.balanceDue },
  { header: "Currency", value: (v: VisaApplication) => v.currency },
  { header: "Submitted", value: (v: VisaApplication) => v.createdAt },
];

async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Copying isn't allowed in this browser.");
  }
}

export function ApplicationsTable() {
  const { params, set } = useListParams();
  const { data, isPending, isError, error, refetch, isRefetching, isPlaceholderData } =
    useApplications(params);
  const { hidden, toggle } = useHiddenColumns("applications");
  const [preview, setPreview] = React.useState<VisaApplication | null>(null);

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
      >
        <DateRangeFilter
          from={params.from}
          to={params.to}
          onChange={(range) => set(range)}
        />
        <ColumnPicker
          columns={columns.filter((c) => !c.required)}
          hidden={hidden}
          onToggle={toggle}
        />
        <ExportCsvButton endpoint="/api/admin/applications" />
      </DataTableToolbar>

      <StatusTabs
        label="Filter by stage"
        value={params.status}
        onChange={(status) => set({ status })}
        counts={data?.meta.counts}
        options={visaStatusValues.map((value) => ({
          value,
          label: visaStatusLabels[value],
        }))}
      />

      <AdminDataTable
        columns={columns}
        rows={data?.data}
        getRowId={(v) => v.id}
        getRowLabel={(v) => v.applicant.name}
        getRowHref={detailHref}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        isRefetching={isRefetching}
        isPlaceholderData={isPlaceholderData}
        errorTitle="Could not load applications"
        empty={
          <EmptyState
            icon={FileCheck2}
            title={copy.empty.title}
            description={copy.empty.body}
            className="border-0"
          />
        }
        sort={params.sort}
        dir={params.dir}
        onSort={(sort, dir) => set({ sort, dir })}
        hiddenColumns={hidden}
        bulkActions={(rows) => (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                downloadCsv("visa-applications-selected.csv", toCsv(rows, selectedCsv))
              }
            >
              <Download className="size-3.5" />
              {listControls.exportSelected}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                void copyText(
                  rows.map((r) => r.reference).join("\n"),
                  listControls.copied(rows.length),
                )
              }
            >
              <Copy className="size-3.5" />
              {listControls.copyReferences}
            </Button>
          </>
        )}
        rowActions={(v) => (
          <>
            <DropdownMenuItem asChild>
              <Link href={detailHref(v)}>
                <ExternalLink />
                {listControls.open}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPreview(v)}>
              <Eye />
              {listControls.quickView}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void copyText(v.reference, listControls.referenceCopied)}
            >
              <Copy />
              {listControls.copyReference}
            </DropdownMenuItem>
          </>
        )}
      />

      {data ? (
        <DataTablePagination
          meta={data.meta}
          onPage={(page) => set({ page })}
          noun="applications"
        />
      ) : null}

      <QuickViewSheet
        open={preview !== null}
        onOpenChange={(open) => (!open ? setPreview(null) : undefined)}
        title={preview?.applicant.name ?? ""}
        description={preview?.reference}
        footer={
          preview ? (
            <Button asChild>
              <Link href={detailHref(preview)}>{listControls.openFull}</Link>
            </Button>
          ) : null
        }
      >
        {preview ? (
          <DetailList>
            <DetailItem label="Stage">
              <VisaStatusBadge status={preview.status} />
            </DetailItem>
            <DetailItem label="Payment">
              <PaymentStatusBadge status={preview.paymentStatus} />
            </DetailItem>
            <DetailItem label="Destination">{preview.destination}</DetailItem>
            <DetailItem label="Category">
              {visaCategoryLabels[preview.category]}
            </DetailItem>
            <DetailItem label="Travel">
              {formatDate(preview.travelDate)} – {formatDate(preview.returnDate)}
            </DetailItem>
            <DetailItem label="Email">{preview.applicant.email}</DetailItem>
            {preview.totalAmount > 0 ? (
              <DetailItem label="Balance">
                {formatCurrency(preview.balanceDue, preview.currency)}
              </DetailItem>
            ) : null}
            <DetailItem label="Submitted">{formatDate(preview.createdAt)}</DetailItem>
          </DetailList>
        ) : null}
      </QuickViewSheet>
    </Card>
  );
}
