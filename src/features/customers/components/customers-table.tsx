"use client";

import { Users } from "lucide-react";

import {
  DataTablePagination,
  DataTableToolbar,
  TableEmptyRow,
  TableSkeletonRows,
  UserAvatar,
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
import { customers as copy } from "@/content/admin";
import { useCustomers } from "@/features/customers/api/use-customers";
import { useListParams } from "@/hooks/use-list-params";
import { formatCurrency, formatRelative } from "@/lib/utils";

const COLUMNS = 5;

export function CustomersTable() {
  const { params, set } = useListParams();
  const { data, isPending, isError, isPlaceholderData } = useCustomers(params);

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
      />

      <div
        data-pending={isPlaceholderData || undefined}
        className="data-pending:opacity-60"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead className="text-right">Applications</TableHead>
              <TableHead className="text-right">Paid to date</TableHead>
              <TableHead className="text-right">Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load customers</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={Users}
                  title={copy.empty.title}
                  description={copy.empty.body}
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={customer} size="sm" className="ring-border" />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium">
                        {customer.name}
                      </p>
                      <a
                        href={`mailto:${customer.email}`}
                        className="truncate text-[12px] text-muted-foreground hover:underline"
                      >
                        {customer.email}
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.country}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {customer.applications}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(customer.lifetimeValue, customer.currency)}
                </TableCell>
                <TableCell className="text-right text-[12.5px] whitespace-nowrap text-muted-foreground">
                  {formatRelative(customer.lastActiveAt)}
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
          noun="customers"
        />
      ) : null}
    </Card>
  );
}
