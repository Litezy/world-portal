"use client";

import Link from "next/link";

import { ArrowLeft, CalendarDays, Mail, MapPin, Phone } from "lucide-react";

import {
  DetailItem,
  DetailList,
  EnquiryStatusBadge,
  UserAvatar,
} from "@/components/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { enquiries as copy, enquiryStatusLabels, serviceLabels } from "@/content/admin";
import { useConsultants } from "@/features/admin/api/use-consultants";
import { useEnquiry } from "@/features/enquiries/api/use-enquiry";
import { useUpdateEnquiry } from "@/features/enquiries/api/use-update-enquiry";
import { formatDate, formatRelative } from "@/lib/utils";
import { enquiryStatusValues } from "@/validations/admin";

const UNASSIGNED = "__unassigned__";

export function EnquiryDetail({ id }: { id: string }) {
  const { data: enquiry, isPending, isError } = useEnquiry(id);
  const { data: consultants } = useConsultants();
  const update = useUpdateEnquiry(id);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Enquiry not found</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          It may have been removed.
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/enquiries">Back to enquiries</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) return <DetailSkeleton />;

  const assignee = consultants?.find((c) => c.id === enquiry.assigneeId);

  return (
    <div className="flex flex-col gap-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link href="/admin/enquiries">
          <ArrowLeft />
          All enquiries
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {copy.detail.eyebrow} · {enquiry.reference}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
                {enquiry.fullName}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {serviceLabels[enquiry.service]} · {formatRelative(enquiry.createdAt)}
              </p>
            </div>
            <EnquiryStatusBadge status={enquiry.status} size="md" />
          </div>

          <DetailList className="mt-8 sm:grid-cols-2">
            <DetailItem label={copy.detail.traveller}>
              <a
                href={`mailto:${enquiry.email}`}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {enquiry.email}
              </a>
            </DetailItem>
            {enquiry.phone ? (
              <DetailItem label="Phone">
                <a
                  href={`tel:${enquiry.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <Phone className="size-3.5 text-muted-foreground" />
                  {enquiry.phone}
                </a>
              </DetailItem>
            ) : null}
            <DetailItem label="Destination">
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-3.5 text-muted-foreground" />
                {enquiry.destination}
              </span>
            </DetailItem>
            <DetailItem label="Travel date">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                {enquiry.travelDate ? formatDate(enquiry.travelDate) : "Not given"}
              </span>
            </DetailItem>
          </DetailList>

          <div className="mt-8">
            <CardTitle className="text-base">{copy.detail.message}</CardTitle>
            <p className="mt-3 text-[13.5px] leading-relaxed text-pretty text-muted-foreground">
              {enquiry.details || copy.detail.noMessage}
            </p>
          </div>

          <Button asChild variant="primary" size="md" className="mt-8 w-fit">
            <a
              href={`mailto:${enquiry.email}?subject=Your enquiry ${enquiry.reference}`}
            >
              <Mail />
              {copy.detail.reply}
            </a>
          </Button>
        </Card>

        <Card variant="solid" radius="lg" padding="none" className="gap-5 p-6">
          <div className="grid gap-2">
            <Label htmlFor="enquiry-status">{copy.detail.status}</Label>
            <Select
              value={enquiry.status}
              disabled={update.isPending}
              onValueChange={(status) =>
                update.mutate(
                  { status: status as (typeof enquiryStatusValues)[number] },
                  { onSuccess: () => toast.success("Status updated") },
                )
              }
            >
              <SelectTrigger id="enquiry-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {enquiryStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {enquiryStatusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="enquiry-assignee">{copy.detail.assign}</Label>
            <Select
              value={enquiry.assigneeId ?? UNASSIGNED}
              disabled={update.isPending}
              onValueChange={(value) =>
                update.mutate(
                  { assigneeId: value === UNASSIGNED ? null : value },
                  { onSuccess: () => toast.success("Assignment updated") },
                )
              }
            >
              <SelectTrigger id="enquiry-assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>{copy.detail.unassigned}</SelectItem>
                {consultants?.map((consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {assignee ? (
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <UserAvatar user={assignee} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{assignee.name}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {assignee.email}
                </p>
              </div>
            </div>
          ) : null}

          <p className="text-[12px] text-muted-foreground">
            Last updated {formatRelative(enquiry.updatedAt)}
          </p>
        </Card>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton shape="text" className="w-32" />
        <Skeleton className="mt-3 h-7 w-56" />
        <SkeletonText lines={4} className="mt-8" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="mt-5 h-11 w-full" />
      </div>
    </div>
  );
}
