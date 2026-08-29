import { cn } from "@/lib/utils";

export type WeeklyPoint = { label: string; visas: number; passports: number };

const SERIES = [
  { key: "visas", label: "Visa", fill: "bg-chart-1" },
  { key: "passports", label: "Passport", fill: "bg-chart-2" },
] as const;

/**
 * Two series, one unit, one axis. Counts are small enough to sit on every cap,
 * so the columns need no gridlines and the values are never colour-only.
 */
export function WeeklyChart({
  data,
  className,
}: {
  data: WeeklyPoint[];
  className?: string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.visas, d.passports]));

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <ul className="flex items-center gap-4">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn("size-2.5 rounded-full", series.fill)}
            />
            <span className="text-[12px] text-muted-foreground">{series.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex h-[168px] items-end gap-1.5 border-b border-chart-grid pb-0 sm:gap-3">
        {data.map((point) => (
          <div
            key={point.label}
            className="flex h-full flex-1 flex-col justify-end gap-2"
          >
            <div className="flex h-full items-end justify-center gap-0.5">
              {SERIES.map((series) => {
                const value = point[series.key];
                return (
                  <div
                    key={series.key}
                    className="flex h-full w-full max-w-6 flex-col justify-end gap-1"
                  >
                    <span className="text-center text-[11px] font-medium text-muted-foreground tabular-nums">
                      {value}
                    </span>
                    <div
                      className={cn("w-full rounded-t-[4px]", series.fill)}
                      style={{
                        height: `${Math.max(value === 0 ? 0 : 3, (value / max) * 100)}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 sm:gap-3">
        {data.map((point) => (
          <p
            key={point.label}
            className="flex-1 text-center text-[11.5px] text-muted-foreground"
          >
            {point.label}
          </p>
        ))}
      </div>
    </div>
  );
}
