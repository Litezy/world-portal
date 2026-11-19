"use client";

import * as React from "react";

import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The current time, re-read every `intervalMs`. Countdown text is coarse
 * (minutes at best), so a slow tick is enough and never re-renders per second.
 */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** "3d", "5h", "12m" — the largest unit that is at least one. */
export function shortDuration(ms: number) {
  const abs = Math.abs(ms);
  if (abs >= DAY) return `${Math.floor(abs / DAY)}d`;
  if (abs >= HOUR) return `${Math.floor(abs / HOUR)}h`;
  return `${Math.max(1, Math.floor(abs / 60_000))}m`;
}

export type SlaState = "ok" | "soon" | "late";

/** Late once past due; "soon" inside the last `soonMs` (a day by default). */
export function slaState(dueAt: number, now: number, soonMs = DAY): SlaState {
  const left = dueAt - now;
  if (left < 0) return "late";
  if (left < soonMs) return "soon";
  return "ok";
}

const styles: Record<SlaState, string> = {
  ok: "bg-muted text-muted-foreground",
  soon: "bg-warning-wash text-warning-text",
  late: "bg-destructive-wash text-destructive-text",
};

/**
 * Time left on a deadline, or how overdue it is — WorldStreet's `Sla` pill.
 * The words carry the meaning, so colour is never the only signal, and the
 * text is not a live region: a screen reader isn't interrupted every tick.
 */
export function SlaPill({
  dueAt,
  soonMs,
  className,
}: {
  dueAt: string | Date;
  soonMs?: number;
  className?: string;
}) {
  const now = useNow();
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;
  const state = slaState(due, now, soonMs);
  const text =
    state === "late"
      ? `${shortDuration(due - now)} overdue`
      : `${shortDuration(due - now)} left`;

  return (
    <span
      data-sla={state}
      title={new Date(due).toLocaleString()}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap tabular-nums",
        styles[state],
        className,
      )}
    >
      <Clock className="size-3" aria-hidden />
      {text}
    </span>
  );
}
