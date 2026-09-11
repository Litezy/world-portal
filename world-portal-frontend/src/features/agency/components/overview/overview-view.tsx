"use client";

import { Banknote, CircleCheckBig, ClipboardList, Users, Wallet } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { agencyOverview as copy } from "@/content/agency";
import { useAgencyAssignments } from "@/features/agency/api/use-assignments";
import { useAgencyOverview } from "@/features/agency/api/use-overview";
import { NextAssignments } from "@/features/agency/components/overview/next-assignments";
import { VerificationPanel } from "@/features/agency/components/overview/verification-panel";
import { WaitingOnYou } from "@/features/agency/components/overview/waiting-on-you";
import type { AgencyAssignment } from "@/features/agency/types";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { cn, formatCurrency } from "@/lib/utils";

/** Soonest first. Both panels read the same order. */
function bySoonest(a: AgencyAssignment, b: AgencyAssignment) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

export function AgencyOverviewView() {
  const overviewQuery = useAgencyOverview();
  // One list feeds both panels: they are two cuts of the same work, and a
  // second request would only let them disagree with each other.
  const assignmentsQuery = useAgencyAssignments({ perPage: 50 });

  if (overviewQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load your dashboard</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : "Please try again."}
          <Button variant="outline" size="sm" onClick={() => overviewQuery.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (overviewQuery.isPending) return <OverviewSkeleton />;

  const overview = overviewQuery.data;
  const assignments = assignmentsQuery.data?.data ?? [];

  const waiting = assignments
    .filter((a) => a.status === "requested" && a.assignedStaffIds.length === 0)
    .sort(bySoonest);

  // Anything still to be turned up for. What is waiting on the agency already
  // has its own panel above, so it is not repeated here.
  const upcoming = assignments
    .filter((a) => a.status === "assigned" || a.status === "in_progress")
    .sort(bySoonest)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={ClipboardList}
          label={copy.stats.openAssignments}
          value={String(overview.openAssignments)}
        />
        <StatCard
          icon={Users}
          label={copy.stats.staff}
          value={`${overview.staffOnDuty} / ${overview.staffTotal}`}
        />
        <StatCard
          icon={CircleCheckBig}
          label={copy.stats.completed}
          value={String(overview.completedThisMonth)}
        />
        <StatCard
          icon={Wallet}
          label={copy.stats.earned}
          value={formatCurrency(overview.earnedThisMonth, overview.currency)}
        />
        <StatCard
          icon={Banknote}
          label={copy.stats.pendingPayout}
          value={formatCurrency(overview.pendingPayout, overview.currency)}
        />
      </div>

      <VerificationPanel overview={overview} />

      {assignmentsQuery.isPending ? (
        <PanelsSkeleton />
      ) : (
        <div
          className={cn(
            "grid gap-4",
            waiting.length > 0 && "lg:grid-cols-2 lg:items-start",
          )}
        >
          <WaitingOnYou assignments={waiting.slice(0, 6)} />
          <NextAssignments assignments={upcoming} />
        </div>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton shape="text" className="w-28" />
            <Skeleton className="mt-4 h-9 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton shape="text" className="w-32" />
        <SkeletonText lines={2} className="mt-3" />
      </div>
      <PanelsSkeleton />
    </div>
  );
}

function PanelsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5">
          <Skeleton shape="text" className="w-36" />
          <SkeletonText lines={4} className="mt-5" />
        </div>
      ))}
    </div>
  );
}
