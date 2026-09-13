"use client";

import Link from "next/link";

import { ArrowLeft, Lock, Mail, Phone } from "lucide-react";

import { DetailItem, DetailList } from "@/components/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { agencyAssignments as copy } from "@/content/agency";
import { useAgencyAssignment } from "@/features/agency/api/use-assignments";
import { categoryCatalog } from "@/features/agency/catalog";
import { AssignmentStatusBadge } from "@/features/agency/components/agency-badges";
import { AssignStaffPanel } from "@/features/agency/components/assignments/assign-staff-panel";
import { formatCurrency, formatDate } from "@/lib/utils";

export function AssignmentDetail({ id }: { id: string }) {
  const { data: assignment, isPending, isError, error } = useAgencyAssignment(id);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load this assignment</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {error instanceof Error ? error.message : "It may have been removed."}
          <Button asChild variant="outline" size="sm">
            <Link href="/agency/assignments">{copy.headingLead}</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) return <DetailSkeleton />;

  const { traveller, destination } = assignment;
  // Contact is released by the service only once staff are assigned, so a null
  // here is the rule working — say so rather than printing an empty field.
  const contactLocked = !traveller.email && !traveller.phone;

  return (
    <div className="flex flex-col gap-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link href="/agency/assignments">
          <ArrowLeft />
          {copy.headingLead}
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {copy.detail.eyebrow} · {assignment.reference}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
                  {assignment.offeringTitle}
                </h1>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {categoryCatalog[assignment.category].label} · {destination.city},{" "}
                  {destination.country}
                </p>
              </div>
              <AssignmentStatusBadge status={assignment.status} />
            </div>

            <DetailList className="mt-8 sm:grid-cols-3">
              <DetailItem label={copy.detail.traveller}>
                {traveller.name}
                {contactLocked ? (
                  <span className="mt-1.5 flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <Lock className="mt-0.5 size-3.5 shrink-0" />
                    {copy.detail.contactLocked}
                  </span>
                ) : (
                  <span className="mt-1.5 flex flex-col gap-1 text-[12.5px]">
                    {traveller.email ? (
                      <a
                        href={`mailto:${traveller.email}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <Mail className="size-3.5 text-muted-foreground" />
                        {traveller.email}
                      </a>
                    ) : null}
                    {traveller.phone ? (
                      <a
                        href={`tel:${traveller.phone}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <Phone className="size-3.5 text-muted-foreground" />
                        {traveller.phone}
                      </a>
                    ) : null}
                  </span>
                )}
              </DetailItem>

              <DetailItem label={copy.detail.partySize}>
                <span className="tabular-nums">{traveller.partySize}</span>
              </DetailItem>

              <DetailItem label={copy.columns.staff}>
                <span className="tabular-nums">
                  {assignment.assignedStaffIds.length}/{assignment.staffRequired}
                </span>
              </DetailItem>

              <DetailItem label={copy.columns.destination}>
                {destination.city}, {destination.country}
              </DetailItem>

              <DetailItem label={copy.columns.dates} className="sm:col-span-2">
                {formatDate(assignment.startsAt, { day: "numeric", month: "short" })}
                {" – "}
                {formatDate(assignment.endsAt)}
              </DetailItem>
            </DetailList>

            <div className="mt-8">
              <DetailItem label={copy.detail.notes}>
                {assignment.notes ? (
                  <span className="text-pretty">{assignment.notes}</span>
                ) : (
                  <span className="text-muted-foreground">{copy.detail.noNotes}</span>
                )}
              </DetailItem>
            </div>
          </Card>

          <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
            <CardTitle className="text-base">{copy.detail.earnings}</CardTitle>
            <DetailList className="mt-6 sm:grid-cols-3">
              <DetailItem label={copy.detail.gross}>
                <span className="tabular-nums">
                  {formatCurrency(assignment.gross, assignment.currency)}
                </span>
              </DetailItem>
              <DetailItem label={copy.detail.fee}>
                <span className="text-muted-foreground tabular-nums">
                  −{formatCurrency(assignment.platformFee, assignment.currency)}
                </span>
              </DetailItem>
              <DetailItem label={copy.detail.net}>
                <span className="text-[15px] font-semibold tabular-nums">
                  {formatCurrency(assignment.netToAgency, assignment.currency)}
                </span>
              </DetailItem>
            </DetailList>
          </Card>
        </div>

        {/*
          Keyed on the saved roster: a successful assign returns a new one, and
          remounting is how the picker picks that up without writing state from
          an effect.
        */}
        <AssignStaffPanel
          key={assignment.assignedStaffIds.join("|")}
          assignment={assignment}
        />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton shape="text" className="w-36" />
        <Skeleton className="mt-3 h-7 w-52" />
        <SkeletonText lines={5} className="mt-8" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton shape="text" className="w-32" />
        <Skeleton className="mt-5 h-16 w-full" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
    </div>
  );
}
