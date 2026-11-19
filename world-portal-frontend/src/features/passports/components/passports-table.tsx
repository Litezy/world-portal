"use client";

import * as React from "react";
import Link from "next/link";

import { BookUser, Copy, Download, ExternalLink, Eye } from "lucide-react";
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
  PassportStatusBadge,
  PaymentStatusBadge,
  QuickViewSheet,
  StatusTabs,
  useHiddenColumns,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
  humanise,
  listControls,
  passports as copy,
  passportStatusLabels,
} from "@/content/admin";
import { usePassports } from "@/features/passports/api/use-passports";
import { useListParams } from "@/hooks/use-list-params";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDate, formatRelative } from "@/lib/utils";
import { passportStatusValues } from "@/server/data/backend-types";
import type { PassportApplication } from "@/types";

const detailHref = (p: PassportApplication) => `/admin/passports/${p.id}`;

const columns: AdminColumn<PassportApplication>[] = [
  {
    id: "applicant",
    header: "Applicant",
    sortKey: "applicant",
    primary: true,
    required: true,
    className: "font-medium",
    cell: (p) => (
      <>
        {p.applicant.name}
        <span className="block font-mono text-[11.5px] font-normal text-muted-foreground">
          {p.reference}
        </span>
      </>
    ),
  },
  {
    id: "category",
    header: "Category",
    sortKey: "category",
    className: "text-muted-foreground",
    cell: (p) => humanise(p.category),
  },
  {
    id: "booklet",
    header: "Booklet",
    className: "text-muted-foreground",
    cell: (p) => `${humanise(p.bookletType)} · ${humanise(p.validity)}`,
  },
  {
    id: "stage",
    header: "Stage",
    sortKey: "status",
    cell: (p) => <PassportStatusBadge status={p.status} />,
  },
  {
    id: "payment",
    header: "Payment",
    cell: (p) => <PaymentStatusBadge status={p.paymentStatus} />,
  },
  {
    id: "submitted",
    header: "Submitted",
    sortKey: "submitted",
    sortFirst: "desc",
    align: "right",
    className: "text-[12.5px] whitespace-nowrap text-muted-foreground",
    cell: (p) => formatRelative(p.createdAt),
  },
];

const selectedCsv = [
  { header: "Reference", value: (p: PassportApplication) => p.reference },
  { header: "Applicant", value: (p: PassportApplication) => p.applicant.name },
  { header: "Email", value: (p: PassportApplication) => p.applicant.email },
  { header: "Category", value: (p: PassportApplication) => p.category },
  { header: "Stage", value: (p: PassportApplication) => p.status },
  { header: "Payment", value: (p: PassportApplication) => p.paymentStatus },
  { header: "Submitted", value: (p: PassportApplication) => p.createdAt },
];

async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Copying isn't allowed in this browser.");
  }
}

export function PassportsTable() {
  const { params, set } = useListParams();
  const { data, isPending, isError, error, refetch, isRefetching, isPlaceholderData } =
    usePassports(params);
  const { hidden, toggle } = useHiddenColumns("passports");
  const [preview, setPreview] = React.useState<PassportApplication | null>(null);

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
        <ExportCsvButton endpoint="/api/admin/passports" />
      </DataTableToolbar>

      <StatusTabs
        label="Filter by stage"
        value={params.status}
        onChange={(status) => set({ status })}
        counts={data?.meta.counts}
        options={passportStatusValues.map((value) => ({
          value,
          label: passportStatusLabels[value],
        }))}
      />

      <AdminDataTable
        columns={columns}
        rows={data?.data}
        getRowId={(p) => p.id}
        getRowLabel={(p) => p.applicant.name}
        getRowHref={detailHref}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        isRefetching={isRefetching}
        isPlaceholderData={isPlaceholderData}
        errorTitle="Could not load passport applications"
        empty={
          <EmptyState
            icon={BookUser}
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
                downloadCsv(
                  "passport-applications-selected.csv",
                  toCsv(rows, selectedCsv),
                )
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
        rowActions={(p) => (
          <>
            <DropdownMenuItem asChild>
              <Link href={detailHref(p)}>
                <ExternalLink />
                {listControls.open}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPreview(p)}>
              <Eye />
              {listControls.quickView}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void copyText(p.reference, listControls.referenceCopied)}
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
          noun="passport applications"
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
              <PassportStatusBadge status={preview.status} />
            </DetailItem>
            <DetailItem label="Payment">
              <PaymentStatusBadge status={preview.paymentStatus} />
            </DetailItem>
            <DetailItem label="Category">{humanise(preview.category)}</DetailItem>
            <DetailItem label="Booklet">
              {humanise(preview.bookletType)} · {humanise(preview.validity)}
            </DetailItem>
            <DetailItem label="State of origin">{preview.stateOfOrigin}</DetailItem>
            <DetailItem label="Email">{preview.applicant.email}</DetailItem>
            <DetailItem label="Submitted">{formatDate(preview.createdAt)}</DetailItem>
          </DetailList>
        ) : null}
      </QuickViewSheet>
    </Card>
  );
}
