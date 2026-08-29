"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { BookUser } from "lucide-react";

import {
  DataTablePagination,
  DataTableToolbar,
  PassportStatusBadge,
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
import { humanise, passports as copy, passportStatusLabels } from "@/content/admin";
import { usePassports } from "@/features/passports/api/use-passports";
import { useListParams } from "@/hooks/use-list-params";
import { formatRelative } from "@/lib/utils";
import { passportStatusValues } from "@/server/data/backend-types";

const COLUMNS = 5;

export function PassportsTable() {
  const router = useRouter();
  const { params, set } = useListParams();
  const { data, isPending, isError, isPlaceholderData } = usePassports(params);

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
          options: passportStatusValues.map((value) => ({
            value,
            label: passportStatusLabels[value],
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
              <TableHead>Category</TableHead>
              <TableHead>Booklet</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load passport applications</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={BookUser}
                  title={copy.empty.title}
                  description={copy.empty.body}
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((record) => (
              <TableRow
                key={record.id}
                data-interactive="true"
                onClick={() => router.push(`/admin/passports/${record.id}`)}
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/passports/${record.id}`}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
                  >
                    {record.applicant.name}
                  </Link>
                  <span className="block font-mono text-[11.5px] font-normal text-muted-foreground">
                    {record.reference}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {humanise(record.category)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {humanise(record.bookletType)} · {humanise(record.validity)}
                </TableCell>
                <TableCell>
                  <PassportStatusBadge status={record.status} />
                </TableCell>
                <TableCell className="text-right text-[12.5px] whitespace-nowrap text-muted-foreground">
                  {formatRelative(record.createdAt)}
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
