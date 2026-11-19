import { chartCopy } from "@/content/admin";

/**
 * The same numbers as the chart above it, as a real table — for screen
 * readers, for anyone who prefers rows, and for copying into a report.
 */
export function ChartTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="group text-[12.5px]">
      <summary className="w-fit cursor-pointer rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {chartCopy.showTable}
      </summary>
      <table className="mt-3 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            {columns.map((column, i) => (
              <th
                key={column}
                scope="col"
                className={
                  i === 0 ? "py-1.5 font-medium" : "py-1.5 text-right font-medium"
                }
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={String(row[0])}
              className="border-b border-border/40 last:border-0"
            >
              {row.map((value, i) =>
                i === 0 ? (
                  <th
                    key={i}
                    scope="row"
                    className="py-1.5 font-normal text-foreground"
                  >
                    {value}
                  </th>
                ) : (
                  <td
                    key={i}
                    className="py-1.5 text-right text-foreground tabular-nums"
                  >
                    {value}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
