import Link from "next/link";

import { CalendarDays, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { agencyOverview as copy } from "@/content/agency";
import type { AgencyAssignment } from "@/features/agency/types";
import { cn, formatDate } from "@/lib/utils";

/**
 * Requested jobs with nobody against them — the one thing on this page that is
 * genuinely the agency's move. The panel is rendered only when something is
 * actually waiting: an empty "waiting on you" list is not a state worth a card.
 */
export function WaitingOnYou({
  assignments,
  className,
}: {
  assignments: AgencyAssignment[];
  className?: string;
}) {
  if (assignments.length === 0) return null;

  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className={cn("gap-0 p-5", className)}
    >
      <CardTitle className="text-base">{copy.unassigned.title}</CardTitle>
      <CardDescription className="text-[13px]">{copy.unassigned.body}</CardDescription>

      <ul className="mt-3 divide-y divide-border/60">
        {assignments.map((assignment) => (
          <li
            key={assignment.id}
            className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-foreground">
                {assignment.offeringTitle}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {assignment.destination.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatDate(assignment.startsAt, { day: "numeric", month: "short" })}
                </span>
                <span className="font-mono text-[11.5px]">{assignment.reference}</span>
              </p>
            </div>

            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href={`/agency/assignments/${assignment.id}`}>
                {copy.unassigned.cta}
                <span className="ml-1.5 tabular-nums">
                  {assignment.assignedStaffIds.length}/{assignment.staffRequired}
                </span>
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
