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
import { Badge } from "@/components/ui/badge";
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
import { agencyStaff as copy, staffStatusLabels } from "@/content/agency";
import { useAgencyStaff } from "@/features/agency/api/use-staff";
import { categoryCatalog } from "@/features/agency/catalog";
import { StaffStatusBadge } from "@/features/agency/components/agency-badges";
import type { AgencyStaffStatus } from "@/features/agency/types";
import { useListParams } from "@/hooks/use-list-params";

const COLUMNS = 6;

const STATUSES = Object.keys(staffStatusLabels) as AgencyStaffStatus[];

export function StaffTable() {
  const { params, set } = useListParams();
  const { data, isPending, isError, isPlaceholderData } = useAgencyStaff(params);

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
            label: staffStatusLabels[value],
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
              <TableHead>{copy.columns.name}</TableHead>
              <TableHead>{copy.columns.role}</TableHead>
              <TableHead>{copy.columns.category}</TableHead>
              <TableHead>{copy.columns.languages}</TableHead>
              <TableHead className="text-right">{copy.columns.experience}</TableHead>
              <TableHead>{copy.columns.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={COLUMNS} /> : null}

            {isError ? (
              <TableEmptyRow cols={COLUMNS}>
                <Alert variant="destructive">
                  <AlertTitle>Could not load your people</AlertTitle>
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

            {data?.data.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={{ name: person.name, avatar: person.photoUrl ?? undefined }}
                      size="sm"
                      className="ring-border"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium">
                        {person.name}
                      </p>
                      {/* Vetting is a word, never a colour on its own. */}
                      <Badge
                        variant={
                          person.backgroundChecked ? "softSuccess" : "softNeutral"
                        }
                        size="sm"
                        dot
                        className="mt-1"
                      >
                        {person.backgroundChecked ? copy.vetted : copy.notVetted}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{person.role}</TableCell>
                <TableCell className="text-muted-foreground">
                  {categoryCatalog[person.category].label}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {person.languages.join(", ")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {person.experienceYears}
                </TableCell>
                <TableCell>
                  <StaffStatusBadge status={person.status} />
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
          noun="staff"
        />
      ) : null}
    </Card>
  );
}
