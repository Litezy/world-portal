import { ArrowDownRight, ArrowUpRight, type LucideIcon, Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  change?: number;
  icon: LucideIcon;
}) {
  const direction =
    change === undefined || change === 0 ? "flat" : change > 0 ? "up" : "down";
  const Arrow =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-ink-800">
          <Icon className="size-4" />
        </span>
      </div>

      <p className="heading-serif mt-4 text-[38px] leading-none font-normal text-ink-900 tabular-nums">
        {value}
      </p>

      <div className="mt-3 flex items-center gap-2">
        {change === undefined ? null : (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium tabular-nums",
              direction === "up" && "bg-success/12 text-success",
              direction === "down" && "bg-destructive/10 text-destructive",
              direction === "flat" && "bg-ink-100 text-ink-700",
            )}
          >
            <Arrow className="size-3" />
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
        {hint ? <p className="text-[12px] text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  );
}
