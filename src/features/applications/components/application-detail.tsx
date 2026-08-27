"use client";

import Link from "next/link";

import { AlertTriangle, ArrowLeft, Mail } from "lucide-react";

import {
  ApplicationStatusBadge,
  DetailItem,
  DetailList,
  UserAvatar,
} from "@/components/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import {
  applications as copy,
  visaCategoryLabels,
  visaRouteLabels,
} from "@/content/admin";
import { useConsultants } from "@/features/admin/api/use-consultants";
import { useApplication } from "@/features/applications/api/use-application";
import { AdvanceApplicationForm } from "@/features/applications/components/advance-application-form";
import { ApplicationTimeline } from "@/features/applications/components/application-timeline";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function ApplicationDetail({ id }: { id: string }) {
  const { data: application, isPending, isError } = useApplication(id);
  const { data: consultants } = useConsultants();

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Application not found</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          It may have been removed.
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/applications">Back to applications</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) return <DetailSkeleton />;

  const consultant = consultants?.find((c) => c.id === application.consultantId);

  return (
    <div className="flex flex-col gap-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link href="/admin/applications">
          <ArrowLeft />
          All applications
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {copy.detail.eyebrow} · {application.reference}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
                {application.applicant.name}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {application.destination} · {visaRouteLabels[application.route]} ·{" "}
                {visaCategoryLabels[application.category]}
              </p>
            </div>
            <ApplicationStatusBadge status={application.status} size="md" />
          </div>

          <DetailList className="mt-8 sm:grid-cols-3">
            <DetailItem label={copy.detail.applicant}>
              <a
                href={`mailto:${application.applicant.email}`}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {application.applicant.email}
              </a>
            </DetailItem>
            <DetailItem label={copy.detail.due}>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  application.overdue && "font-medium text-destructive",
                )}
              >
                {application.overdue ? (
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                ) : null}
                {formatDate(application.dueAt)}
                {application.overdue ? (
                  <span className="sr-only">— overdue</span>
                ) : null}
              </span>
            </DetailItem>
            <DetailItem label={copy.detail.fee}>
              {formatCurrency(application.fee, application.currency)}
            </DetailItem>
          </DetailList>

          <div className="mt-8">
            <CardTitle className="text-base">{copy.detail.timeline}</CardTitle>
            <ApplicationTimeline events={application.timeline} />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card variant="solid" radius="lg" padding="none" className="p-6">
            <AdvanceApplicationForm id={id} status={application.status} />
          </Card>

          {consultant ? (
            <Card variant="solid" radius="lg" padding="none" className="gap-3 p-6">
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {copy.detail.consultant}
              </p>
              <div className="flex items-center gap-3">
                <UserAvatar user={consultant} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{consultant.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {consultant.email}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
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
        <Skeleton className="h-11 w-full" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>
    </div>
  );
}
