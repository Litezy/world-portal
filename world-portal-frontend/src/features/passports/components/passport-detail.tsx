"use client";

import Link from "next/link";

import { ArrowLeft, Mail } from "lucide-react";

import { DetailItem, DetailList, PassportStatusBadge } from "@/components/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { humanise, passports as copy } from "@/content/admin";
import { usePassport } from "@/features/passports/api/use-passport";
import { AdvancePassportForm } from "@/features/passports/components/advance-passport-form";
import { formatRelative } from "@/lib/utils";

export function PassportDetail({ id }: { id: string }) {
  const { data: record, isPending, isError, error } = usePassport(id);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load this application</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {error instanceof Error ? error.message : "It may have been removed."}
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/passports">Back to passports</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) return <DetailSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link href="/admin/passports">
          <ArrowLeft />
          All passport applications
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {copy.detail.eyebrow} · {record.reference}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
                {record.applicant.name}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {humanise(record.category)} · {formatRelative(record.createdAt)}
              </p>
            </div>
            <PassportStatusBadge status={record.status} size="md" />
          </div>

          <DetailList className="mt-8 sm:grid-cols-2">
            <DetailItem label={copy.detail.applicant}>
              <a
                href={`mailto:${record.applicant.email}`}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {record.applicant.email}
              </a>
            </DetailItem>
            <DetailItem label="Phone">{record.applicant.phone ?? "—"}</DetailItem>
            <DetailItem label={copy.detail.validity}>
              {humanise(record.validity)}
            </DetailItem>
            <DetailItem label={copy.detail.booklet}>
              {humanise(record.bookletType)}
            </DetailItem>
            <DetailItem label={copy.detail.origin}>{record.stateOfOrigin}</DetailItem>
          </DetailList>

          <div className="mt-8">
            <CardTitle className="text-base">{copy.detail.notes}</CardTitle>
            <p className="mt-3 text-[13.5px] leading-relaxed text-pretty text-muted-foreground">
              {record.rejectionReason ??
                record.verificationNotes ??
                copy.detail.noNotes}
            </p>
          </div>

          <Button asChild variant="primary" size="md" className="mt-8 w-fit">
            <a
              href={`mailto:${record.applicant.email}?subject=Your application ${record.reference}`}
            >
              <Mail />
              {copy.detail.reply}
            </a>
          </Button>
        </Card>

        <Card variant="solid" radius="lg" padding="none" className="p-6">
          <AdvancePassportForm id={id} status={record.status} />
        </Card>
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
      </div>
    </div>
  );
}
