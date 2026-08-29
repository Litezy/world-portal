import { cn } from "@/lib/utils";

export type BarListItem = { label: string; value: number; hint?: string };

/**
 * One series, so one hue — length carries the magnitude and the row order
 * carries the sequence. Every value is labelled, which is also the contrast
 * relief the brand fill needs.
 */
export function BarList({
  items,
  emptyLabel = "Nothing here yet",
  className,
}: {
  items: BarListItem[];
  emptyLabel?: string;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((sum, i) => sum + i.value, 0);

  if (total === 0) {
    return (
      <p className={cn("text-[13px] text-muted-foreground", className)}>{emptyLabel}</p>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5"
        >
          <p className="text-[13px] text-foreground">{item.label}</p>
          <p className="text-[13px] font-semibold text-foreground tabular-nums">
            {item.value}
          </p>
          <div className="col-span-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-r-[4px] bg-chart-1"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
