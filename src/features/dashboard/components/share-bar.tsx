import { cn } from "@/lib/utils";

export type ShareSegment = { label: string; value: number };

const SERIES = ["bg-chart-1", "bg-chart-2", "bg-chart-3"] as const;

/** Part-to-whole. Segments are separated by a surface gap, never a stroke. */
export function ShareBar({
  segments,
  className,
}: {
  segments: ShareSegment[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-ink-100">
        {segments.map((segment, i) => (
          <div
            key={segment.label}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", SERIES[i])}
            style={{ width: `${total === 0 ? 0 : (segment.value / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {segments.map((segment, i) => (
          <li key={segment.label} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cn("size-2.5 shrink-0 rounded-full", SERIES[i])}
            />
            <span className="text-[13px] text-foreground">{segment.label}</span>
            <span className="ml-auto text-[13px] font-semibold text-foreground tabular-nums">
              {segment.value}
            </span>
            <span className="w-11 text-right text-[12px] text-muted-foreground tabular-nums">
              {total === 0 ? "0%" : `${Math.round((segment.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
