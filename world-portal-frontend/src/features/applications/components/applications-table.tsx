"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FileCheck2 } from "lucide-react";

import {
  DataTablePagination,
  DataTableToolbar,
  PaymentStatusBadge,
  TableEmptyRow,
  TableSkeletonRows,
  VisaStatusBadge,
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
import {
  applications as copy,
  visaCategoryLabels,
  visaStatusLabels,
} from "@/content/admin";
import { useApplications } from "@/features/applications/api/use-applications";
import { useListParams } from "@/hooks/use-list-params";
import { formatCurrency, formatRelative } from "@/lib/utils";
import { visaStatusValues } from "@/server/data/backend-types";

const COLUMNS = 6;

export function ApplicationsTable() {
  const router = useRouter();
  const { params, set } = useListParams();
  const { data, isPending, isError, isPlaceholderData } = useApplications(params);

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
        filter={{
          value: params.status,
          onChange: (status) => set({ status }),
          label: "All stages",
          options: visaStatusValues.map((value) => ({
            value,
            label: visaStatusLabels[value],
          })),
        }}
      />

      <div
        data-pending={isPlaceholderData || undefined}
        className="data-pending:opacity-60"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Applicant</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load applications</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={FileCheck2}
                  title={copy.empty.title}
                  description={copy.empty.body}
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((application) => (
              <TableRow
                key={application.id}
                data-interactive="true"
                onClick={() => router.push(`/admin/applications/${application.id}`)}
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/applications/${application.id}`}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
                  >
                    {application.applicant.name}
                  </Link>
                  <span className="block font-mono text-[11.5px] font-normal text-muted-foreground">
                    {application.reference}
                  </span>
                </TableCell>
                <TableCell>{application.destination}</TableCell>
                <TableCell className="text-muted-foreground">
                  {visaCategoryLabels[application.category]}
                </TableCell>
                <TableCell>
                  <VisaStatusBadge status={application.status} />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={application.paymentStatus} />
                  {application.totalAmount > 0 ? (
                    <span className="mt-1 block text-[11.5px] text-muted-foreground tabular-nums">
                      {formatCurrency(application.amountPaid)} of{" "}
                      {formatCurrency(application.totalAmount)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right text-[12.5px] whitespace-nowrap text-muted-foreground">
                  {formatRelative(application.createdAt)}
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
          noun="applications"
        />
      ) : null}
    </Card>
  );
}
