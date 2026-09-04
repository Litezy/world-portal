import { passportStatusLabels, visaStatusLabels } from "@/content/admin";
import { cn, formatDate } from "@/lib/utils";
import type { ApplicationEvent } from "@/types";

const labels: Record<string, string> = {
  ...visaStatusLabels,
  ...passportStatusLabels,
};

export function ApplicationTimeline({ events }: { events: ApplicationEvent[] }) {
  return (
    <ol className="relative mt-5 flex flex-col gap-6">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-[5px] w-px bg-border"
      />
      {events.map((event, i) => {
        const latest = i === events.length - 1;
        return (
          <li key={`${event.status}-${event.at}`} className="relative pl-7">
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1 left-0 size-[11px] rounded-full ring-4 ring-card",
                latest ? "bg-primary" : "bg-ink-200",
              )}
            />
            <p
              className={cn(
                "text-[13.5px] font-medium",
                latest ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {labels[event.status] ?? event.status}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {formatDate(event.at, {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            {event.note ? (
              <p className="mt-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-[12.5px] leading-relaxed text-muted-foreground">

                {event.note}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
