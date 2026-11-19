"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";

import { TableEmptyRow, TableSkeletonRows } from "@/components/admin/data-table";
import { TableError } from "@/components/admin/table-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listControls as copy } from "@/content/admin";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/types";

export type AdminColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** A sort key the list route allows; makes the header a sort button. */
  sortKey?: string;
  /** First click sorts this way (dates read best newest-first). */
  sortFirst?: SortDirection;
  align?: "left" | "right";
  className?: string;
  /** The card title on phones. Exactly one column should set it. */
  primary?: boolean;
  /** Always shown; left out of the column picker. */
  required?: boolean;
};

/**
 * The console's list table, built on WorldStreet's table conventions:
 * sortable headers (`aria-sort`), selection limited to the visible rows with
 * a sticky bulk bar, a row overflow menu, and cards instead of a table on
 * phones. Filters, sort and page live in the URL (`useListParams`); this
 * component only renders and reports intent.
 */
export function AdminDataTable<T>({
  columns,
  rows,
  getRowId,
  getRowLabel,
  getRowHref,
  isPending,
  isError,
  error,
  onRetry,
  isRefetching,
  isPlaceholderData,
  errorTitle,
  empty,
  sort,
  dir,
  onSort,
  hiddenColumns = [],
  bulkActions,
  rowActions,
}: {
  columns: AdminColumn<T>[];
  rows?: T[];
  getRowId: (row: T) => string;
  /** Read by screen readers on the row checkbox ("Select Ada Okafor"). */
  getRowLabel: (row: T) => string;
  getRowHref?: (row: T) => string;
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  onRetry: () => void;
  isRefetching?: boolean;
  isPlaceholderData?: boolean;
  errorTitle: string;
  empty: React.ReactNode;
  sort?: string;
  dir?: SortDirection;
  onSort?: (sort: string, dir: SortDirection) => void;
  hiddenColumns?: string[];
  /** Rendered in the sticky bar while rows are selected. Enables selection. */
  bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
  /** `DropdownMenuItem`s for one row. */
  rowActions?: (row: T) => React.ReactNode;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  const visible = columns.filter((c) => c.required || !hiddenColumns.includes(c.id));
  const selectable = Boolean(bulkActions);
  const colCount = visible.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  // Selection is scoped to what's on screen: a hidden row is never acted on.
  const selected = (rows ?? []).filter((row) => selectedIds.has(getRowId(row)));
  const allSelected = Boolean(rows?.length) && selected.length === rows?.length;
  const clear = () => setSelectedIds(new Set());

  const toggle = (id: string) =>
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set((rows ?? []).map(getRowId)));

  const sortBy = (column: AdminColumn<T>) => {
    if (!column.sortKey || !onSort) return;
    const nextDir: SortDirection =
      sort === column.sortKey
        ? dir === "asc"
          ? "desc"
          : "asc"
        : (column.sortFirst ?? "asc");
    onSort(column.sortKey, nextDir);
  };

  const primary = visible.find((c) => c.primary) ?? visible[0];
  const secondary = visible.filter((c) => c !== primary);

  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <TableError
          title={errorTitle}
          error={error}
          onRetry={onRetry}
          isRetrying={isRefetching}
        />
      </div>
    );
  }

  return (
    <div
      data-pending={isPlaceholderData || undefined}
      className="data-pending:opacity-60"
    >
      {selectable && selected.length > 0 ? (
        <div
          role="region"
          aria-label={copy.selected(selected.length)}
          className="sticky top-16 z-20 flex flex-wrap items-center gap-2 border-b border-border/60 bg-primary/5 px-4 py-2.5 backdrop-blur sm:px-6"
        >
          <span className="text-[13px] font-semibold text-foreground">
            {copy.selected(selected.length)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions?.(selected, clear)}
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={clear}>
            {copy.clear}
          </Button>
        </div>
      ) : null}

      {/* Tablets and up: a table. */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allSelected ? true : selected.length > 0 ? "indeterminate" : false
                    }
                    onCheckedChange={toggleAll}
                    aria-label={copy.selectAll}
                    disabled={!rows?.length}
                  />
                </TableHead>
              ) : null}
              {visible.map((column) => {
                const active = sort === column.sortKey && Boolean(column.sortKey);
                return (
                  <TableHead
                    key={column.id}
                    aria-sort={
                      active ? (dir === "desc" ? "descending" : "ascending") : undefined
                    }
                    className={cn(
                      column.align === "right" && "text-right",
                      column.className,
                    )}
                  >
                    {column.sortKey && onSort ? (
                      <button
                        type="button"
                        onClick={() => sortBy(column)}
                        aria-label={copy.sortBy(column.header)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          column.align === "right" && "flex-row-reverse",
                          active && "text-foreground",
                        )}
                      >
                        {column.header}
                        {active ? (
                          dir === "desc" ? (
                            <ArrowDown className="size-3" aria-hidden />
                          ) : (
                            <ArrowUp className="size-3" aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
              {rowActions ? (
                <TableHead className="w-12">
                  <span className="sr-only">{copy.rowActions}</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? <TableSkeletonRows cols={colCount} /> : null}
            {rows?.length === 0 ? (
              <TableEmptyRow cols={colCount}>{empty}</TableEmptyRow>
            ) : null}
            {rows?.map((row) => {
              const id = getRowId(row);
              const href = getRowHref?.(row);
              return (
                <TableRow
                  key={id}
                  data-interactive={href ? "true" : undefined}
                  data-state={selectedIds.has(id) ? "selected" : undefined}
                  onClick={href ? () => router.push(href) : undefined}
                >
                  {selectable ? (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(id)}
                        onCheckedChange={() => toggle(id)}
                        aria-label={copy.selectRow(getRowLabel(row))}
                      />
                    </TableCell>
                  ) : null}
                  {visible.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        column.align === "right" && "text-right",
                        column.className,
                      )}
                    >
                      {column === primary && href ? (
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
                        >
                          {column.cell(row)}
                        </Link>
                      ) : (
                        column.cell(row)
                      )}
                    </TableCell>
                  ))}
                  {rowActions ? (
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="text-right"
                    >
                      <RowMenu label={getRowLabel(row)}>{rowActions(row)}</RowMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Phones: one card per row, every visible column as a labelled line. */}
      <ul className="flex flex-col divide-y divide-border/60 md:hidden">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex flex-col gap-2 p-4">
                <Skeleton shape="text" className="w-40" />
                <Skeleton shape="text" className="w-24" />
              </li>
            ))
          : null}
        {rows?.length === 0 ? <li className="p-4">{empty}</li> : null}
        {rows?.map((row) => {
          const id = getRowId(row);
          const href = getRowHref?.(row);
          return (
            <li
              key={id}
              data-state={selectedIds.has(id) ? "selected" : undefined}
              className="flex gap-3 p-4 data-[state=selected]:bg-muted"
            >
              {selectable ? (
                <Checkbox
                  className="mt-0.5"
                  checked={selectedIds.has(id)}
                  onCheckedChange={() => toggle(id)}
                  aria-label={copy.selectRow(getRowLabel(row))}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-[14px] font-medium">
                    {href ? (
                      <Link href={href} className="underline-offset-4 hover:underline">
                        {primary?.cell(row)}
                      </Link>
                    ) : (
                      primary?.cell(row)
                    )}
                  </div>
                  {rowActions ? (
                    <RowMenu label={getRowLabel(row)}>{rowActions(row)}</RowMenu>
                  ) : null}
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
                  {secondary.map((column) => (
                    <React.Fragment key={column.id}>
                      <dt className="text-muted-foreground">{column.header}</dt>
                      <dd className="min-w-0 text-foreground">{column.cell(row)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${copy.rowActions}: ${label}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
