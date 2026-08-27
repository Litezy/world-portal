"use client";

import * as React from "react";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import type { Paginated } from "@/types";

const ALL = "__all__";

export function DataTableToolbar({
  search,
  onSearch,
  placeholder,
  filter,
  children,
}: {
  search?: string;
  onSearch: (q: string) => void;
  placeholder: string;
  filter?: {
    value?: string;
    onChange: (value?: string) => void;
    label: string;
    options: { value: string; label: string }[];
  };
  children?: React.ReactNode;
}) {
  const [value, setValue] = React.useState(search ?? "");
  const commit = useDebouncedCallback(onSearch, 300);

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="relative w-full sm:max-w-md">
        <Input
          size="sm"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            commit(e.target.value);
          }}
          placeholder={placeholder}
          aria-label="Search"
          leftIcon={<Search />}
          rightIcon={
            value ? (
              <button
                type="button"
                aria-label="Clear search"
                className="pointer-events-auto rounded-full p-1 hover:text-foreground"
                onClick={() => {
                  setValue("");
                  onSearch("");
                }}
              >
                <X className="size-3.5" />
              </button>
            ) : undefined
          }
        />
      </div>

      <div className="flex items-center gap-2">
        {filter ? (
          <Select
            value={filter.value ?? ALL}
            onValueChange={(v) => filter.onChange(v === ALL ? undefined : v)}
          >
            <SelectTrigger size="sm" className="w-[190px]" aria-label={filter.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filter.label}</SelectItem>
              {filter.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function DataTablePagination({
  meta,
  onPage,
  noun,
}: {
  meta: Paginated<unknown>["meta"];
  onPage: (page: number) => void;
  noun: string;
}) {
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.perPage + 1;
  const to = Math.min(meta.page * meta.perPage, meta.total);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-3 sm:px-6">
      <p className="text-[12.5px] text-muted-foreground">
        {meta.total === 0 ? `No ${noun}` : `${from}–${to} of ${meta.total} ${noun}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-16 text-center text-[12.5px] text-muted-foreground tabular-nums">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function TableSkeletonRows({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <TableRow key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <TableCell key={c}>
              <Skeleton shape="text" className={c === 0 ? "w-40" : "w-24"} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function TableEmptyRow({
  cols,
  children,
}: {
  cols: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={cols} className="p-6">
        {children}
      </TableCell>
    </TableRow>
  );
}
