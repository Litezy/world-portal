"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Inbox } from "lucide-react";

import {
  DataTablePagination,
  DataTableToolbar,
  EnquiryStatusBadge,
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
import { enquiries as copy, enquiryStatusLabels, serviceLabels } from "@/content/admin";
import { useEnquiries } from "@/features/enquiries/api/use-enquiries";
import { useListParams } from "@/hooks/use-list-params";
import { formatRelative } from "@/lib/utils";
import { enquiryStatusValues } from "@/validations/admin";

const COLUMNS = 6;

export function EnquiriesTable() {
  const router = useRouter();
  const { params, set } = useListParams();
  const { data, isPending, isError, isPlaceholderData } = useEnquiries(params);

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
          options: enquiryStatusValues.map((value) => ({
            value,
            label: enquiryStatusLabels[value],
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
              <TableHead>Traveller</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load enquiries</AlertTitle>
                  <AlertDescription>Refresh the page to try again.</AlertDescription>
                </Alert>
              </TableEmptyRow>
            ) : null}

            {data?.data.length === 0 ? (
              <TableEmptyRow cols={COLUMNS}>
                <EmptyState
                  icon={Inbox}
                  title={copy.empty.title}
                  description={copy.empty.body}
                  className="border-0"
                />
              </TableEmptyRow>
            ) : null}

            {data?.data.map((enquiry) => (
              <TableRow
                key={enquiry.id}
                data-interactive="true"
                onClick={() => router.push(`/admin/enquiries/${enquiry.id}`)}
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/enquiries/${enquiry.id}`}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
                  >
                    {enquiry.fullName}
                  </Link>
                  <span className="block text-[12px] font-normal text-muted-foreground">
                    {enquiry.email}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {serviceLabels[enquiry.service]}
                </TableCell>
                <TableCell>{enquiry.destination}</TableCell>
                <TableCell className="font-mono text-[12px] text-muted-foreground">
                  {enquiry.reference}
                </TableCell>
                <TableCell>
                  <EnquiryStatusBadge status={enquiry.status} />
                </TableCell>
                <TableCell className="text-right text-[12.5px] whitespace-nowrap text-muted-foreground">
                  {formatRelative(enquiry.createdAt)}
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
          noun="enquiries"
        />
      ) : null}
    </Card>
  );
}
