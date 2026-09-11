import Link from "next/link";

import { ArrowRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { agencyOverview as copy } from "@/content/agency";
import { AssignmentStatusBadge } from "@/features/agency/components/agency-badges";
import type { AgencyAssignment } from "@/features/agency/types";
import { cn, formatDate } from "@/lib/utils";

/** What the agency has to turn up for, soonest first. */
export function NextAssignments({
  assignments,
  className,
}: {
  assignments: AgencyAssignment[];
  className?: string;
}) {
  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className={cn("gap-0 p-5", className)}
    >
      <div className="flex items-center justify-between gap-4">
        <CardTitle className="text-base">{copy.upcoming.title}</CardTitle>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/agency/assignments">
            {copy.upcoming.cta}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState icon={CalendarDays} title={copy.upcoming.empty} className="mt-4" />
      ) : (
        <ul className="mt-2 divide-y divide-border/60">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <Link
                href={`/agency/assignments/${assignment.id}`}
                className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-foreground">
                    {assignment.offeringTitle}
                  </p>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    {assignment.destination.city}, {assignment.destination.country} ·{" "}
                    {assignment.traveller.name}
                  </p>
                </div>

                <AssignmentStatusBadge status={assignment.status} />

                <span className="hidden w-24 shrink-0 text-right text-[12px] whitespace-nowrap text-muted-foreground sm:block">
                  {formatDate(assignment.startsAt, { day: "numeric", month: "short" })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
