import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-primary/10 text-primary",
  success: "bg-success-wash text-success-text",
  warning: "bg-warning-wash text-warning-text",
  info: "bg-info-wash text-info-text",
  danger: "bg-destructive-wash text-destructive-text",
} as const;

/**
 * One KPI tile: label, big figure, a line of context, and an optional link to
 * the list behind the number (WorldStreet's triage tiles: count → queue).
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  action,
  className,
}: {
  label: string;
  /** A React node so callers can pass multi-currency figures. */
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  /** e.g. a "View queue" link. */
  action?: React.ReactNode;
  className?: string;
}) {
  const isLong = typeof value === "string" && value.length > 10;
  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className={cn("flex flex-col justify-between gap-0 p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      <div
        className={cn(
          "mt-3 font-sans font-bold tracking-tight whitespace-nowrap text-foreground tabular-nums",
          isLong
            ? "text-lg leading-tight sm:text-xl lg:text-[22px]"
            : "text-[32px] leading-none",
        )}
      >
        {value}
      </div>

      {hint ? (
        <div className="mt-2 text-[12px] text-muted-foreground">{hint}</div>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </Card>
  );
}
