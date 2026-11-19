"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Columns3, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { listControls as copy } from "@/content/admin";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

/** Hidden optional columns for one list, remembered on this device. */
export function useHiddenColumns(listKey: string) {
  const [hidden, setHidden] = useLocalStorage<string[]>(
    `e-embassy-admin-cols:${listKey}`,
    [],
  );
  const toggle = React.useCallback(
    (id: string) =>
      setHidden((previous) =>
        previous.includes(id) ? previous.filter((c) => c !== id) : [...previous, id],
      ),
    [setHidden],
  );
  return { hidden, toggle };
}

/**
 * Status tabs with counts, WorldStreet-style ("Under review (12)"). Counts
 * come from the list route (`meta.counts`) and cover the whole filtered set,
 * not just the current page. Scrolls sideways on phones.
 */
export function StatusTabs({
  value,
  onChange,
  options,
  counts,
  allLabel = copy.all,
  label,
}: {
  value?: string;
  onChange: (value?: string) => void;
  options: { value: string; label: string }[];
  counts?: Record<string, number>;
  allLabel?: string;
  label: string;
}) {
  const total = counts
    ? Object.values(counts).reduce((sum, n) => sum + n, 0)
    : undefined;
  const tabs = [
    { value: undefined, label: allLabel, count: total },
    ...options.map((o) => ({
      ...o,
      count: counts?.[o.value] ?? (counts ? 0 : undefined),
    })),
  ];

  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mb-px flex gap-1 overflow-x-auto border-b border-border/60 px-4 sm:px-6"
    >
      {tabs.map((tab) => {
        const selected = (value ?? undefined) === tab.value;
        return (
          <button
            key={tab.value ?? "all"}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  selected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Submission-date range as two native date fields — accessible and phone-friendly. */
export function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="list-from">
        {copy.from}
      </label>
      <Input
        id="list-from"
        type="date"
        size="sm"
        value={from ?? ""}
        max={to}
        onChange={(e) => onChange({ from: e.target.value || undefined, to })}
        className="w-[150px]"
        aria-label={copy.from}
      />
      <span className="text-[12px] text-muted-foreground" aria-hidden>
        –
      </span>
      <label className="sr-only" htmlFor="list-to">
        {copy.to}
      </label>
      <Input
        id="list-to"
        type="date"
        size="sm"
        value={to ?? ""}
        min={from}
        onChange={(e) => onChange({ from, to: e.target.value || undefined })}
        className="w-[150px]"
        aria-label={copy.to}
      />
    </div>
  );
}

/**
 * Downloads every row matching the current filters (not just this page) as
 * CSV, straight from the list route — the filters travel in the URL.
 */
export function ExportCsvButton({ endpoint }: { endpoint: string }) {
  const searchParams = useSearchParams();
  const query = new URLSearchParams(searchParams.toString());
  query.delete("page");
  query.set("format", "csv");

  return (
    <Button asChild variant="outline" size="sm" className="gap-1.5">
      <a href={`${endpoint}?${query.toString()}`} download>
        <Download className="size-3.5" />
        {copy.export}
      </a>
    </Button>
  );
}

/** Show or hide optional columns; the choice is remembered per list. */
export function ColumnPicker({
  columns,
  hidden,
  onToggle,
}: {
  columns: { id: string; header: string }[];
  hidden: string[];
  onToggle: (id: string) => void;
}) {
  if (columns.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="size-3.5" />
          {copy.columns}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{copy.columnsLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={!hidden.includes(column.id)}
            onCheckedChange={() => onToggle(column.id)}
            onSelect={(e) => e.preventDefault()}
          >
            {column.header}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
