"use client";

import { Copy, Download, Users } from "lucide-react";
import { toast } from "sonner";

import {
  type AdminColumn,
  AdminDataTable,
  ColumnPicker,
  DataTablePagination,
  DataTableToolbar,
  DateRangeFilter,
  ExportCsvButton,
  useHiddenColumns,
} from "@/components/admin";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { customers as copy, listControls } from "@/content/admin";
import { useCustomers } from "@/features/customers/api/use-customers";
import { useListParams } from "@/hooks/use-list-params";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatMultiCurrencyInline, formatRelative } from "@/lib/utils";
import type { Customer } from "@/types";

const columns: AdminColumn<Customer>[] = [
  {
    id: "name",
    header: "Applicant",
    sortKey: "name",
    primary: true,
    required: true,
    cell: (c) => (
      <div className="flex items-center gap-3">
        <UserAvatar user={c} size="sm" className="ring-border" />
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium">{c.name}</p>
          <a
            href={`mailto:${c.email}`}
            className="truncate text-[12px] text-muted-foreground hover:underline"
          >
            {c.email}
          </a>
        </div>
      </div>
    ),
  },
  {
    id: "country",
    header: "Nationality",
    sortKey: "country",
    className: "text-muted-foreground",
    cell: (c) => c.country,
  },
  {
    id: "applications",
    header: "Applications",
    sortKey: "applications",
    sortFirst: "desc",
    align: "right",
    className: "tabular-nums",
    cell: (c) => c.applications,
  },
  {
    id: "paid",
    header: "Paid to date",
    align: "right",
    className: "font-medium tabular-nums",
    cell: (c) => formatMultiCurrencyInline(c.paidByCurrency),
  },
  {
    id: "lastActive",
    header: "Last active",
    sortKey: "lastActive",
    sortFirst: "desc",
    align: "right",
    className: "text-[12.5px] whitespace-nowrap text-muted-foreground",
    cell: (c) => formatRelative(c.lastActiveAt),
  },
];

const selectedCsv = [
  { header: "Name", value: (c: Customer) => c.name },
  { header: "Email", value: (c: Customer) => c.email },
  { header: "Phone", value: (c: Customer) => c.phone },
  { header: "Country", value: (c: Customer) => c.country },
  { header: "Applications", value: (c: Customer) => c.applications },
  { header: "Last active", value: (c: Customer) => c.lastActiveAt },
];

export function CustomersTable() {
  const { params, set } = useListParams();
  const { data, isPending, isError, error, refetch, isRefetching, isPlaceholderData } =
    useCustomers(params);
  const { hidden, toggle } = useHiddenColumns("applicants");

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
        <ExportCsvButton endpoint="/api/admin/customers" />
      </DataTableToolbar>

      <AdminDataTable
        columns={columns}
        rows={data?.data}
        getRowId={(c) => c.id}
        getRowLabel={(c) => c.name}
        getRowHref={(c) => `/admin/customers/${c.id}`}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        isRefetching={isRefetching}
        isPlaceholderData={isPlaceholderData}
        errorTitle="Could not load applicants"
        empty={
          <EmptyState
            icon={Users}
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
                downloadCsv("applicants-selected.csv", toCsv(rows, selectedCsv))
              }
            >
              <Download className="size-3.5" />
              {listControls.exportSelected}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard
                  .writeText(rows.map((r) => r.email).join(", "))
                  .then(() => toast.success(copy.emailsCopied(rows.length)))
                  .catch(() => toast.error("Copying isn't allowed in this browser."));
              }}
            >
              <Copy className="size-3.5" />
              {copy.copyEmails}
            </Button>
          </>
        )}
      />

      {data ? (
        <DataTablePagination
          meta={data.meta}
          onPage={(page) => set({ page })}
          noun="applicants"
        />
      ) : null}
    </Card>
  );
}
