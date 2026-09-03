"use client";

import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>

      <p className="font-sans mt-3 text-[32px] leading-none font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </p>


      {hint ? <p className="mt-3 text-[12px] text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
