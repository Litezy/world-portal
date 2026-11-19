/**
 * Minimal RFC 4180 CSV, shared by the console's export routes (every filtered
 * row) and the bulk bar (the selected rows).
 *
 * Cells starting with `= + - @` are prefixed with `'` so a spreadsheet never
 * runs an applicant-supplied value as a formula (CSV injection).
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function cell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]) {
  const lines = [
    columns.map((c) => cell(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => cell(c.value(row))).join(",")),
  ];
  // CRLF per RFC 4180; Excel also expects it.
  return `${lines.join("\r\n")}\r\n`;
}

/** Save a CSV string in the browser. */
export function downloadCsv(filename: string, csv: string) {
  // The BOM makes Excel read UTF-8 names (Ọlá, Müller) correctly.
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
