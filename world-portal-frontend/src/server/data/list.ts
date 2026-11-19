import { NextResponse } from "next/server";

import { type CsvColumn, toCsv } from "@/lib/csv";
import { paginate } from "@/server/http";
import type { SortDirection } from "@/types";

/**
 * The console's list engine. The service returns whole collections (search is
 * its own filter), so filtering by date and status, counting, sorting, paging
 * and CSV export happen here — once — for every list.
 */

type ListQuery = {
  status?: string;
  page: number;
  perPage: number;
  sort?: string;
  dir?: SortDirection;
  from?: string;
  to?: string;
  format: "json" | "csv";
};

export type ListSpec<T> = {
  /** The row's status, for the status filter and the tab counts. */
  statusOf?: (row: T) => string;
  /** ISO timestamp the date range applies to. */
  dateOf: (row: T) => string;
  /** Allow-listed sort keys. Unknown keys fall back to `defaultSort`. */
  sorters: Record<string, (a: T, b: T) => number>;
  defaultSort: { key: string; dir: SortDirection };
  csv: { filename: string; columns: CsvColumn<T>[] };
};

const DAY_MS = 86_400_000;

function inRange(iso: string, from?: string, to?: string) {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return !from && !to;
  if (from && at < Date.parse(`${from}T00:00:00Z`)) return false;
  // `to` is inclusive: anything before the start of the following day.
  if (to && at >= Date.parse(`${to}T00:00:00Z`) + DAY_MS) return false;
  return true;
}

export function byText<T>(pick: (row: T) => string | null | undefined) {
  return (a: T, b: T) =>
    (pick(a) ?? "").localeCompare(pick(b) ?? "", undefined, { sensitivity: "base" });
}

export function byNumber<T>(pick: (row: T) => number) {
  return (a: T, b: T) => pick(a) - pick(b);
}

export function byDate<T>(pick: (row: T) => string | null | undefined) {
  return (a: T, b: T) =>
    (Date.parse(pick(a) ?? "") || 0) - (Date.parse(pick(b) ?? "") || 0);
}

/** Applies dates → counts → status → sort, then pages or exports. */
export function listResponse<T>(rows: T[], query: ListQuery, spec: ListSpec<T>) {
  const dated = rows.filter((row) => inRange(spec.dateOf(row), query.from, query.to));

  const counts: Record<string, number> | undefined = spec.statusOf ? {} : undefined;
  if (spec.statusOf && counts) {
    for (const row of dated) {
      const status = spec.statusOf(row);
      counts[status] = (counts[status] ?? 0) + 1;
    }
  }

  const filtered =
    query.status && spec.statusOf
      ? dated.filter((row) => spec.statusOf?.(row) === query.status)
      : dated;

  // Own keys only: `sorters[sort]` alone let `?sort=valueOf` (or any other
  // Object.prototype name) through as a comparator, which threw a 500.
  const known = Boolean(query.sort && Object.hasOwn(spec.sorters, query.sort));
  const key = known && query.sort ? query.sort : spec.defaultSort.key;
  const dir = known ? (query.dir ?? "asc") : spec.defaultSort.dir;
  const compare = spec.sorters[key];
  const sorted = compare
    ? [...filtered].sort((a, b) => (dir === "asc" ? compare(a, b) : compare(b, a)))
    : filtered;

  if (query.format === "csv") {
    const stamp = new Date().toISOString().slice(0, 10);
    // The BOM makes Excel read UTF-8 names (Ọlá, Müller) correctly, as the
    // browser-side download in `lib/csv.ts` already does.
    return new NextResponse(`﻿${toCsv(sorted, spec.csv.columns)}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${spec.csv.filename}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const page = paginate(sorted, query.page, query.perPage);
  return NextResponse.json({ data: page.data, meta: { ...page.meta, counts } });
}
