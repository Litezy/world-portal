"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ClipboardList } from "lucide-react";

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
import { agencyAssignments as copy, assignmentStatusLabels } from "@/content/agency";
import { useAgencyAssignments } from "@/features/agency/api/use-assignments";
import { AssignmentStatusBadge } from "@/features/agency/components/agency-badges";
import type { AssignmentStatus } from "@/features/agency/types";
import { useListParams } from "@/hooks/use-list-params";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const COLUMNS = 8;

/** Catalog order, straight off the label record — never a second hand-kept list. */
const STATUSES = Object.keys(assignmentStatusLabels) as AssignmentStatus[];

export function AssignmentsTable() {
  const router = useRouter();
  const { params, set } = useListParams();
  const { data, isPending, isError, isPlaceholderData } = useAgencyAssignments(params);

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
            label: assignmentStatusLabels[value],
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
              <TableHead>{copy.columns.service}</TableHead>
              <TableHead>{copy.columns.traveller}</TableHead>
              <TableHead>{copy.columns.destination}</TableHead>
              <TableHead>{copy.columns.dates}</TableHead>
              <TableHead className="text-right">{copy.columns.staff}</TableHead>
              <TableHead>{copy.columns.status}</TableHead>
              <TableHead className="text-right">{copy.columns.net}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load assignments</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={ClipboardList}
                  title={copy.empty.title}
                  description={copy.empty.body}
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((assignment) => {
              const short =
                assignment.assignedStaffIds.length < assignment.staffRequired;

              return (
                <TableRow
                  key={assignment.id}
                  data-interactive="true"
                  onClick={() => router.push(`/agency/assignments/${assignment.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/agency/assignments/${assignment.id}`}
                      className="rounded-sm font-mono text-[12.5px] underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
                    >
                      {assignment.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{assignment.offeringTitle}</TableCell>
                  <TableCell>
                    {assignment.traveller?.name || "Applicant"}
                    <span className="block text-[11.5px] font-normal text-muted-foreground tabular-nums">
                      {copy.detail.partySize}: {assignment.traveller?.partySize ?? 1}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {assignment.destination?.city || "Destination City"}, {assignment.destination?.country || "Country"}
                  </TableCell>
                  <TableCell className="text-[12.5px] whitespace-nowrap text-muted-foreground">
                    {formatDate(assignment.startsAt, {
                      day: "numeric",
                      month: "short",
                    })}
                    {" – "}
                    {formatDate(assignment.endsAt, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      short && "font-medium text-amber-600",
                    )}
                  >
                    {assignment.assignedStaffIds.length}/{assignment.staffRequired}
                  </TableCell>
                  <TableCell>
                    <AssignmentStatusBadge status={assignment.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(assignment.netToAgency, assignment.currency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {data ? (
        <DataTablePagination
          meta={data.meta}
          onPage={(page) => set({ page })}
          noun="assignments"
        />
      ) : null}
    </Card>
  );
}
