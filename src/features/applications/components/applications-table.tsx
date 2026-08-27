"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertTriangle, FileCheck2 } from "lucide-react";

import {
  ApplicationStatusBadge,
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
import {
  applications as copy,
  applicationStatusLabels,
  visaRouteLabels,
} from "@/content/admin";
import { useApplications } from "@/features/applications/api/use-applications";
import { useListParams } from "@/hooks/use-list-params";
import { cn, formatDate } from "@/lib/utils";
import { applicationStatusValues } from "@/validations/admin";

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
          options: applicationStatusValues.map((value) => ({
            value,
            label: applicationStatusLabels[value],
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
              <TableHead>Route</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Decision due</TableHead>
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
                  <span className="block text-[12px] font-normal text-muted-foreground">
                    {application.applicant.email}
                  </span>
                </TableCell>
                <TableCell>{application.destination}</TableCell>
                <TableCell className="text-muted-foreground">
                  {visaRouteLabels[application.route]}
                </TableCell>
                <TableCell className="font-mono text-[12px] text-muted-foreground">
                  {application.reference}
                </TableCell>
                <TableCell>
                  <ApplicationStatusBadge status={application.status} />
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right text-[12.5px] whitespace-nowrap",
                    application.overdue
                      ? "font-medium text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="inline-flex items-center justify-end gap-1.5">
                    {application.overdue ? (
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                    ) : null}
                    {formatDate(application.dueAt, { day: "numeric", month: "short" })}
                    {application.overdue ? (
                      <span className="sr-only">— overdue</span>
                    ) : null}
                  </span>
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
